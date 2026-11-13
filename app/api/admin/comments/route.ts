import { NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/admin-api';
import { createServiceClient } from '@/lib/supabase/service';
import { submitAkismetFeedback, type AkismetCommentPayload } from '@/lib/comment-moderation';
import type { TablesUpdate } from '@/types/database';

type CommentStatus = 'pending' | 'approved' | 'rejected' | 'spam' | 'deleted';

export async function GET() {
  const auth = await authorizeAdmin();
  if ('response' in auth) return auth.response;

  const { data, error } = await auth.supabase.from('comments')
    .select('id,article_id,author_id,body,status,created_at,moderation_source,moderation_reason,moderation_previous_status,deleted_at,author:profiles!comments_author_id_profiles_fkey(display_name,avatar_url)')
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

async function sendAkismetFeedback(commentId: string, type: 'spam' | 'ham') {
  const service = createServiceClient();
  const { data: context } = await service.from('comment_moderation_context')
    .select('payload').eq('comment_id', commentId).maybeSingle();
  const payload = context?.payload as (AkismetCommentPayload & { akismet_checked?: boolean }) | null;
  if (!payload?.akismet_checked) return false;

  const sent = await submitAkismetFeedback(payload, type);
  if (sent && type === 'ham') {
    await service.from('comment_moderation_context').delete().eq('comment_id', commentId);
  }
  return sent;
}

export async function PATCH(request: Request) {
  const auth = await authorizeAdmin();
  if ('response' in auth) return auth.response;

  const input = await request.json().catch(() => null);
  const id = typeof input?.id === 'string' ? input.id : '';
  const action = typeof input?.action === 'string' ? input.action : '';
  const requestedStatus = input?.status as CommentStatus | undefined;
  if (!id) return NextResponse.json({ error: '评论编号无效' }, { status: 400 });

  const { data: existing, error: readError } = await auth.supabase.from('comments')
    .select('id,status,moderation_previous_status').eq('id', id).maybeSingle();
  if (readError || !existing) return NextResponse.json({ error: '评论不存在或无权操作' }, { status: 404 });

  let update: TablesUpdate<'comments'>;
  let auditAction: string;
  let feedback: 'spam' | 'ham' | null = null;

  if (action === 'spam') {
    if (existing.status === 'deleted') return NextResponse.json({ error: '请先恢复已删除评论，再标记为垃圾评论。' }, { status: 400 });
    update = {
      status: 'spam',
      moderation_previous_status: existing.status === 'spam' ? existing.moderation_previous_status || 'pending' : existing.status,
      moderation_source: 'admin',
      moderation_reason: '管理员标记为垃圾评论',
      deleted_at: null,
      deleted_by: null,
      updated_at: new Date().toISOString(),
    };
    auditAction = 'comment.mark_spam';
    feedback = 'spam';
  } else if (action === 'delete') {
    if (existing.status === 'deleted') return NextResponse.json({ error: '评论已经在已删除列表中。' }, { status: 400 });
    update = {
      status: 'deleted',
      moderation_previous_status: existing.status,
      moderation_source: 'admin',
      moderation_reason: '管理员删除评论',
      deleted_at: new Date().toISOString(),
      deleted_by: auth.user.id,
      updated_at: new Date().toISOString(),
    };
    auditAction = 'comment.soft_delete';
  } else if (action === 'restore') {
    if (existing.status !== 'spam' && existing.status !== 'deleted') return NextResponse.json({ error: '该评论当前不需要恢复。' }, { status: 400 });
    const restoredStatus = existing.moderation_previous_status &&
      ['pending', 'approved', 'rejected', 'spam'].includes(existing.moderation_previous_status)
      ? existing.moderation_previous_status : 'pending';
    update = {
      status: restoredStatus,
      moderation_previous_status: null,
      moderation_source: null,
      moderation_reason: null,
      deleted_at: null,
      deleted_by: null,
      updated_at: new Date().toISOString(),
    };
    auditAction = 'comment.restore';
    if (existing.status === 'spam' && restoredStatus !== 'spam') feedback = 'ham';
  } else if (['pending', 'approved', 'rejected'].includes(requestedStatus || '')) {
    if (existing.status === 'spam' || existing.status === 'deleted') return NextResponse.json({ error: '请使用恢复操作处理垃圾评论或已删除评论。' }, { status: 400 });
    update = {
      status: requestedStatus,
      moderation_source: requestedStatus === 'pending' ? 'admin' : null,
      moderation_reason: null,
      moderation_previous_status: null,
      updated_at: new Date().toISOString(),
    };
    auditAction = requestedStatus === 'approved' ? 'comment.approve' : requestedStatus === 'rejected' ? 'comment.reject' : 'comment.return_to_pending';
  } else {
    return NextResponse.json({ error: '评论操作无效' }, { status: 400 });
  }

  const { data, error } = await auth.supabase.from('comments').update(update).eq('id', id)
    .select('id,status,moderation_previous_status,moderation_reason,deleted_at').maybeSingle();
  if (error) return NextResponse.json({ error: '评论状态更新失败' }, { status: 500 });
  if (!data) return NextResponse.json({ error: '评论状态更新失败，请刷新后重试。' }, { status: 404 });

  await auth.supabase.from('audit_logs').insert({
    actor_id: auth.user.id, action: auditAction, entity_type: 'comment', entity_id: id,
    details: { status: data.status },
  });
  if (feedback) await sendAkismetFeedback(id, feedback);
  return NextResponse.json({ comment: data });
}

export async function DELETE(request: Request) {
  const auth = await authorizeAdmin();
  if ('response' in auth) return auth.response;

  const id = new URL(request.url).searchParams.get('id') || '';
  if (!id) return NextResponse.json({ error: '评论编号无效' }, { status: 400 });
  const { data: existing } = await auth.supabase.from('comments').select('id,status').eq('id', id).maybeSingle();
  if (!existing) return NextResponse.json({ error: '评论不存在或无权操作' }, { status: 404 });

  const { data, error } = await auth.supabase.from('comments').delete().eq('id', id).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: '评论永久删除失败' }, { status: 500 });
  if (!data) return NextResponse.json({ error: '评论永久删除失败，请刷新后重试。' }, { status: 404 });

  await auth.supabase.from('audit_logs').insert({
    actor_id: auth.user.id, action: 'comment.permanently_delete', entity_type: 'comment', entity_id: id,
    details: { previous_status: existing.status },
  });
  return NextResponse.json({ success: true });
}
