import { NextResponse } from 'next/server';
import { authorizeContentEditor } from '@/lib/admin-api';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeContentEditor();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const { data, error } = await auth.supabase.from('articles').select('*').eq('id', id).single();
  if (error || !data) return NextResponse.json({ error: '文章不存在' }, { status: 404 });
  return NextResponse.json({ article: data });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeContentEditor();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const input = await req.json().catch(() => null);
  const title = typeof input?.title === 'string' ? input.title.trim() : '';
  const slug = typeof input?.slug === 'string' ? input.slug.trim() : '';
  const content = typeof input?.content_markdown === 'string' ? input.content_markdown : '';
  const excerpt = typeof input?.excerpt === 'string' ? input.excerpt.trim().slice(0, 300) : '';
  const status = input?.status === 'published' ? 'published' : 'draft';
  if (!title || title.length > 160 || !slugPattern.test(slug) || slug.length > 180) return NextResponse.json({ error: '请检查标题和 Slug 格式' }, { status: 400 });
  if (status === 'published' && !content.trim()) return NextResponse.json({ error: '发布前请先填写文章正文' }, { status: 400 });
  if (content.length > 500000) return NextResponse.json({ error: '文章内容过大' }, { status: 413 });
  const { data: previous } = await auth.supabase.from('articles').select('title,excerpt,content_markdown,published_at').eq('id', id).maybeSingle();
  if (!previous) return NextResponse.json({ error: '文章不存在' }, { status: 404 });
  const { error } = await auth.supabase.from('articles').update({
    title, slug, excerpt, content_markdown: content, status,
    published_at: status === 'published' ? previous.published_at || new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (error) return NextResponse.json({ error: error.code === '23505' ? '这个 Slug 已被使用' : '更新文章失败' }, { status: 400 });
  await auth.supabase.from('article_revisions').insert({ article_id: id, editor_id: auth.user.id, title: previous.title, excerpt: previous.excerpt, content_markdown: previous.content_markdown });
  await auth.supabase.from('audit_logs').insert({ actor_id: auth.user.id, action: status === 'published' ? 'article.publish' : 'article.update', entity_type: 'article', entity_id: id });
  return NextResponse.json({ success: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeContentEditor();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const { error } = await auth.supabase.from('articles').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', id);
  if (error) return NextResponse.json({ error: '归档失败' }, { status: 400 });
  return NextResponse.json({ success: true });
}
