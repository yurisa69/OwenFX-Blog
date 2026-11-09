import { NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/admin-api';

export async function GET() {
  const auth = await authorizeAdmin();
  if ('response' in auth) return auth.response;

  const { data, error } = await auth.supabase.from('comments')
    .select('id,article_id,author_id,body,status,created_at,author:profiles!comments_author_id_profiles_fkey(display_name,avatar_url)')
    .order('created_at', { ascending: false }).limit(500);
  if (error) return NextResponse.json({ error: '评论列表读取失败' }, { status: 500 });

  const articleIds = Array.from(new Set((data || []).map(row => row.article_id)));
  const { data: articles, error: articleError } = articleIds.length
    ? await auth.supabase.from('articles').select('id,title,slug').in('id', articleIds)
    : { data: [], error: null };
  if (articleError) return NextResponse.json({ error: '评论所属文章读取失败' }, { status: 500 });

  const articleMap = new Map((articles || []).map(article => [article.id, article]));
  const comments = (data || []).map(row => ({
    ...row,
    author: Array.isArray(row.author) ? row.author[0] || null : row.author,
    article: articleMap.get(row.article_id) || null,
  }));
  return NextResponse.json({ comments });
}

export async function PATCH(req: Request) {
  const auth = await authorizeAdmin();
  if ('response' in auth) return auth.response;

  const input = await req.json().catch(() => null);
  const id = typeof input?.id === 'string' ? input.id : '';
  const status = input?.status;
  if (!id || !['pending', 'approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: '评论编号或目标状态无效' }, { status: 400 });
  }

  const { data, error } = await auth.supabase.from('comments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id,status')
    .maybeSingle();
  if (error) return NextResponse.json({ error: '评论状态更新失败' }, { status: 500 });
  if (!data) return NextResponse.json({ error: '评论不存在或无权操作' }, { status: 404 });

  await auth.supabase.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: status === 'approved' ? 'comment.approve' : status === 'rejected' ? 'comment.reject' : 'comment.return_to_pending',
    entity_type: 'comment',
    entity_id: id,
    details: { status },
  });

  return NextResponse.json({ comment: data });
}
