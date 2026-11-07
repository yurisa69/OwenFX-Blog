import { NextResponse } from 'next/server';
import { authorizeContentEditor } from '@/lib/admin-api';
import { articleMarkdownPath, deleteMarkdownFile, hashMarkdown, readMarkdownFile, writeMarkdownFile } from '@/lib/github-articles';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeContentEditor();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const { data, error } = await auth.supabase.from('articles').select('*').eq('id', id).single();
  if (error || !data) return NextResponse.json({ error: '文章不存在' }, { status: 404 });
  let content = '';
  if (data.github_path) {
    const file = await readMarkdownFile(data.github_path);
    if (!file) return NextResponse.json({ error: 'GitHub 中找不到文章正文文件' }, { status: 502 });
    content = file.content;
  }
  return NextResponse.json({ article: { ...data, content_markdown: content } });
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

  const { data: previous, error: readError } = await auth.supabase.from('articles')
    .select('id,title,excerpt,slug,github_path,github_sha,content_hash,published_at')
    .eq('id', id).maybeSingle();
  if (readError || !previous) return NextResponse.json({ error: '文章不存在' }, { status: 404 });

  const path = articleMarkdownPath(slug);
  const { data: duplicate } = await auth.supabase.from('articles').select('id').eq('slug', slug).neq('id', id).maybeSingle();
  if (duplicate) return NextResponse.json({ error: '这个 Slug 已被使用' }, { status: 409 });

  let saved;
  try {
    saved = await writeMarkdownFile(path, content, `Update article: ${title}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'GitHub 正文保存失败';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const contentHash = hashMarkdown(content);
  const { error } = await auth.supabase.from('articles').update({
    title, slug, excerpt, status, github_path: path, github_sha: saved.commitSha,
    content_hash: contentHash,
    published_at: status === 'published' ? (previous.published_at || new Date().toISOString()) : null,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (error) {
    return NextResponse.json({ error: '正文已提交 GitHub，但文章元数据同步失败；请重试保存', github_path: path, sync_pending: true }, { status: 502 });
  }

  const revision = await auth.supabase.from('article_revisions').insert({
    article_id: id, editor_id: auth.user.id, title, excerpt,
    github_path: path, github_sha: saved.commitSha, content_hash: contentHash,
  });
  await auth.supabase.from('audit_logs').insert({
    actor_id: auth.user.id, action: status === 'published' ? 'article.publish' : 'article.update',
    entity_type: 'article', entity_id: id,
    details: { storage: 'github', github_path: path, github_sha: saved.commitSha, revision_recorded: !revision.error },
  });

  if (previous.github_path && previous.github_path !== path) {
    try {
      const oldFile = await readMarkdownFile(previous.github_path);
      if (oldFile) await deleteMarkdownFile(previous.github_path, oldFile.sha, `Move article to ${path}`);
    } catch (cleanupError) {
      console.error('[article-file-cleanup]', cleanupError);
    }
  }

  return NextResponse.json({ success: true, github_path: path, github_sha: saved.commitSha, revision_recorded: !revision.error });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeContentEditor();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const { error } = await auth.supabase.from('articles').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', id);
  if (error) return NextResponse.json({ error: '归档失败' }, { status: 400 });
  await auth.supabase.from('audit_logs').insert({ actor_id: auth.user.id, action: 'article.archive', entity_type: 'article', entity_id: id });
  return NextResponse.json({ success: true });
}
