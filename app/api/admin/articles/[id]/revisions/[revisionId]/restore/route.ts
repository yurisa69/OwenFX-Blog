import { NextResponse } from 'next/server';
import { authorizeContentEditor } from '@/lib/admin-api';
import { articleMarkdownPath, hashMarkdown, readMarkdownFile, writeMarkdownFile } from '@/lib/github-articles';

export async function POST(_: Request, { params }: { params: Promise<{ id: string; revisionId: string }> }) {
  const auth = await authorizeContentEditor();
  if ('response' in auth) return auth.response;
  const { id, revisionId } = await params;

  const { data: article } = await auth.supabase.from('articles')
    .select('id,title,slug,excerpt,status,github_path,published_at')
    .eq('id', id).maybeSingle();
  if (!article) return NextResponse.json({ error: '文章不存在' }, { status: 404 });

  const { data: revision } = await auth.supabase.from('article_revisions')
    .select('id,title,excerpt,github_path,github_sha,content_hash')
    .eq('id', revisionId).eq('article_id', id).maybeSingle();
  if (!revision?.github_path || !revision.github_sha) {
    return NextResponse.json({ error: '该历史版本没有可恢复的 GitHub 文件引用' }, { status: 422 });
  }

  let historical;
  try {
    historical = await readMarkdownFile(revision.github_path, revision.github_sha);
  } catch (error) {
    const message = error instanceof Error ? error.message : '读取历史版本失败';
    return NextResponse.json({ error: message }, { status: 502 });
  }
  if (!historical) return NextResponse.json({ error: 'GitHub 中找不到该历史版本文件' }, { status: 404 });

  const path = articleMarkdownPath(article.slug);
  let saved;
  try {
    saved = await writeMarkdownFile(path, historical.content, `Restore article revision: ${article.title}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : '恢复 GitHub 文章失败';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const contentHash = hashMarkdown(historical.content);
  const { error } = await auth.supabase.from('articles').update({
    github_path: path,
    github_sha: saved.commitSha,
    content_hash: contentHash,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (error) {
    return NextResponse.json({ error: 'GitHub 已恢复历史正文，但文章元数据同步失败', sync_pending: true }, { status: 502 });
  }

  const newRevision = await auth.supabase.from('article_revisions').insert({
    article_id: id, editor_id: auth.user.id, title: article.title, excerpt: article.excerpt,
    github_path: path, github_sha: saved.commitSha, content_hash: contentHash,
  });
  await auth.supabase.from('audit_logs').insert({
    actor_id: auth.user.id, action: 'article.revision.restore', entity_type: 'article', entity_id: id,
    details: { restored_revision_id: revisionId, github_path: path, github_sha: saved.commitSha, revision_recorded: !newRevision.error },
  });

  return NextResponse.json({ success: true, github_path: path, github_sha: saved.commitSha });
}
