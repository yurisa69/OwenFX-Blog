import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { authorizeContentEditor } from '@/lib/admin-api';
import { articleMarkdownPath, hashMarkdown, validateMarkdownImageUrls, writeMarkdownFile } from '@/lib/github-articles';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET() {
  const auth = await authorizeContentEditor();
  if ('response' in auth) return auth.response;
  const { data, error } = await auth.supabase.from('articles')
    .select('id,title,slug,excerpt,status,updated_at,published_at,github_path,github_sha,content_hash')
    .order('updated_at', { ascending: false }).limit(200);
  if (error) return NextResponse.json({ error: '文章列表读取失败' }, { status: 500 });
  return NextResponse.json({ articles: data ?? [] });
}

export async function POST(req: Request) {
  const auth = await authorizeContentEditor();
  if ('response' in auth) return auth.response;
  const input = await req.json().catch(() => null);
  const title = typeof input?.title === 'string' ? input.title.trim() : '';
  const slug = typeof input?.slug === 'string' ? input.slug.trim() : '';
  const content = typeof input?.content_markdown === 'string' ? input.content_markdown : '';
  const excerpt = typeof input?.excerpt === 'string' ? input.excerpt.trim().slice(0, 300) : '';
  const status = input?.status === 'published' ? 'published' : 'draft';

  if (!title || title.length > 160) return NextResponse.json({ error: '标题不能为空且不能超过160字' }, { status: 400 });
  if (!slugPattern.test(slug) || slug.length > 180) return NextResponse.json({ error: 'Slug 仅允许小写字母、数字和连字符' }, { status: 400 });
  if (status === 'published' && !content.trim()) return NextResponse.json({ error: '发布前请先填写文章正文' }, { status: 400 });
  if (content.length > 500000) return NextResponse.json({ error: '文章内容过大' }, { status: 413 });
  const imageError = validateMarkdownImageUrls(content);
  if (imageError) return NextResponse.json({ error: imageError }, { status: 422 });

  const { data: duplicate } = await auth.supabase.from('articles').select('id').eq('slug', slug).maybeSingle();
  if (duplicate) return NextResponse.json({ error: '这个 Slug 已被使用' }, { status: 409 });

  const path = articleMarkdownPath(slug);
  let saved;
  try {
    saved = await writeMarkdownFile(path, content, `Add article: ${title}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'GitHub 正文保存失败';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const { data, error } = await auth.supabase.from('articles').insert({
    title, slug, excerpt, status, author_id: auth.user.id,
    github_path: path, github_sha: saved.commitSha, content_hash: hashMarkdown(content),
    published_at: status === 'published' ? new Date().toISOString() : null,
  }).select('id').single();

  if (error) {
    return NextResponse.json({
      error: error.code === '23505' ? '这个 Slug 已被使用' : 'Markdown 已写入 GitHub，但文章元数据保存失败；请重试同步',
      github_path: path,
      sync_pending: true,
    }, { status: 502 });
  }

  if (status === 'published') revalidateTag('github-articles', { expire: 0 });

  const revision = await auth.supabase.from('article_revisions').insert({
    article_id: data.id, editor_id: auth.user.id, title, excerpt,
    github_path: path, github_sha: saved.commitSha, content_hash: hashMarkdown(content),
  });
  await auth.supabase.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: status === 'published' ? 'article.publish' : 'article.create',
    entity_type: 'article', entity_id: data.id,
    details: { storage: 'github', github_path: path, github_sha: saved.commitSha, revision_recorded: !revision.error },
  });
  if (revision.error) {
    return NextResponse.json({ id: data.id, warning: '文章已保存，但版本索引未能写入，请稍后检查', github_path: path }, { status: 201 });
  }
  return NextResponse.json({ id: data.id, github_path: path, github_sha: saved.commitSha }, { status: 201 });
}
