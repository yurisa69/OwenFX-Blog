import { isIP } from 'node:net';
import { NextResponse } from 'next/server';
import { classifyCommentLocally, checkAkismetComment, type AkismetCommentPayload } from '@/lib/comment-moderation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

function getClientIp(request: Request) {
  const candidates = [request.headers.get('x-real-ip'), request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()];
  return candidates.find(value => value && isIP(value)) || '';
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: '请先登录后发表评论。' }, { status: 401 });

  const input = await request.json().catch(() => null);
  const articleId = typeof input?.articleId === 'string' ? input.articleId : '';
  const body = typeof input?.body === 'string' ? input.body.trim() : '';
  const honeypot = typeof input?.website === 'string' ? input.website : '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(articleId)) {
    return NextResponse.json({ error: '文章信息无效，请刷新页面后重试。' }, { status: 400 });
  }
  if (!body || Array.from(body).length > 600) {
    return NextResponse.json({ error: '评论内容不能为空，且最多 600 字。' }, { status: 400 });
  }

  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin) return NextResponse.json({ error: '请求来源无效。' }, { status: 403 });
    } catch {
      return NextResponse.json({ error: '请求来源无效。' }, { status: 403 });
    }
  }

  const service = createServiceClient();
  const { data: article, error: articleError } = await service.from('articles')
    .select('id,slug').eq('id', articleId).eq('status', 'published').maybeSingle();
  if (articleError || !article) return NextResponse.json({ error: '文章不存在或暂不接受评论。' }, { status: 404 });

  const { data: isAdmin } = await supabase.rpc('is_owenfx_admin');
  const isSiteAdmin = isAdmin === true;
  let rateLimited = false;
  if (!isSiteAdmin) {
    const { data: withinLimit, error: rateError } = await service.rpc('consume_comment_rate_limit', {
      p_user_id: user.id, p_limit: 5, p_window_seconds: 600,
    });
    if (rateError) return NextResponse.json({ error: '评论服务暂时不可用，请稍后重试。' }, { status: 503 });
    rateLimited = withinLimit === false;
  }

  const localDecision = isSiteAdmin ? { action: 'pass' as const } : classifyCommentLocally(body, honeypot);
  const duplicateCheck = !isSiteAdmin && !rateLimited
    ? await service.from('comments').select('id', { count: 'exact', head: true })
        .eq('author_id', user.id).eq('body', body)
        .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
    : { count: 0, error: null };
  const duplicate = !isSiteAdmin && (duplicateCheck.count || 0) > 0;

  const ip = getClientIp(request);
  const blog = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const permalink = new URL(`/articles/${encodeURIComponent(article.slug)}`, blog).toString();
  const { data: profile } = await service.from('profiles').select('display_name').eq('id', user.id).maybeSingle();
  const payload: AkismetCommentPayload = {
    blog, user_ip: ip,
    user_agent: (request.headers.get('user-agent') || '').slice(0, 512),
    referrer: (request.headers.get('referer') || '').slice(0, 2048),
    permalink, comment_type: 'comment',
    comment_author: profile?.display_name || user.email?.split('@')[0] || '用户',
    comment_author_email: user.email || '',
    comment_content: body, comment_date_gmt: new Date().toISOString(), blog_lang: 'zh_CN',
  };

  let akismetDecision: 'spam' | 'ham' | 'unavailable' = 'unavailable';
  if (!isSiteAdmin && !rateLimited && !duplicate && localDecision.action !== 'spam') {
    akismetDecision = await checkAkismetComment(payload);
  }

  const isSpam = !isSiteAdmin && (rateLimited || duplicate || localDecision.action === 'spam' || akismetDecision === 'spam');
  const needsReview = !isSiteAdmin && !isSpam && (localDecision.action === 'review' || akismetDecision === 'unavailable');
  const status = isSiteAdmin ? 'approved' : isSpam ? 'spam' : needsReview ? 'pending' : 'approved';
  const moderationSource = isSiteAdmin ? null
    : rateLimited || duplicate || localDecision.action === 'spam' ? 'local_rule'
    : akismetDecision === 'spam' ? 'akismet'
    : localDecision.action === 'review' || akismetDecision === 'unavailable' ? 'local_rule'
    : null;
  const moderationReason = isSiteAdmin ? null
    : rateLimited ? '短时间内提交评论过于频繁'
    : duplicate ? '短时间内重复提交相同评论'
    : localDecision.reason || (akismetDecision === 'spam' ? 'Akismet 判定为垃圾评论'
      : akismetDecision === 'unavailable' ? '反垃圾服务暂不可用，转入人工审核' : null);

  const { data: comment, error: insertError } = await service.from('comments').insert({
    article_id: articleId, author_id: user.id, body, status,
    moderation_source: moderationSource, moderation_reason: moderationReason,
  }).select('id,author_id,body,status,created_at,author:profiles!comments_author_id_profiles_fkey(display_name,avatar_url)').single();
  if (insertError || !comment) return NextResponse.json({ error: '评论提交失败，请稍后重试。' }, { status: 500 });

  if (!isSiteAdmin && akismetDecision !== 'unavailable') {
    await service.from('comment_moderation_context').upsert({
      comment_id: comment.id,
      payload: { ...payload, akismet_checked: true, akismet_decision: akismetDecision },
    });
  }
  const normalizedComment = { ...comment, author: Array.isArray(comment.author) ? comment.author[0] || null : comment.author };
  return NextResponse.json({ comment: normalizedComment }, { status: 201 });
}
