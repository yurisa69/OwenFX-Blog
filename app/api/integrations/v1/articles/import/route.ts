import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { articleMarkdownPath, hashMarkdown, writeMarkdownFile } from '@/lib/github-articles';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const requestIdPattern = /^[a-zA-Z0-9._:-]{8,120}$/;

export async function POST(request: Request) {
  const authorization = request.headers.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token || !token.startsWith('owfx_')) {
    return NextResponse.json({ error: '缺少有效的 OwenFX 导入授权' }, { status: 401 });
  }

  let input: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 600_000) return NextResponse.json({ error: '导入内容超过 600 KB 限制' }, { status: 413 });
    input = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: '请求必须是有效的 JSON' }, { status: 400 });
  }

  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const slug = typeof input.slug === 'string' ? input.slug.trim() : '';
  const excerpt = typeof input.excerpt === 'string' ? input.excerpt.trim().slice(0, 300) : '';
  const markdown = typeof input.markdown === 'string' ? input.markdown : '';
  const requestId = typeof input.request_id === 'string' ? input.request_id.trim() : '';
  const categorySlug = typeof input.category === 'string' ? input.category.trim() : '';
  const tagSlugs = Array.isArray(input.tags)
    ? input.tags.filter((tag): tag is string => typeof tag === 'string').map(tag => tag.trim()).filter(Boolean).slice(0, 12)
    : [];

  if (!title || title.length > 160) return NextResponse.json({ error: '标题不能为空且不能超过 160 字' }, { status: 400 });
  if (!slugPattern.test(slug) || slug.length > 180) return NextResponse.json({ error: 'Slug 仅允许小写字母、数字和连字符' }, { status: 400 });
  if (!markdown.trim()) return NextResponse.json({ error: 'Markdown 正文不能为空' }, { status: 400 });
  if (markdown.length > 500_000) return NextResponse.json({ error: 'Markdown 正文不能超过 500 KB' }, { status: 413 });
  if (!requestIdPattern.test(requestId)) return NextResponse.json({ error: 'request_id 必须为 8 至 120 位字母、数字或 . _ : -' }, { status: 400 });

  const service = createServiceClient();
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const { data: device, error: deviceError } = await service.from('api_devices')
    .select('id,user_id,scopes,active,expires_at').eq('token_hash', tokenHash).maybeSingle();
  if (deviceError || !device || !device.active) return NextResponse.json({ error: '导入授权无效或已撤销' }, { status: 401 });
  if (device.expires_at && new Date(device.expires_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: '导入授权已过期' }, { status: 401 });
  }
  if (!Array.isArray(device.scopes) || !device.scopes.includes('articles:import')) {
    return NextResponse.json({ error: '此授权没有文章导入权限' }, { status: 403 });
  }

  const idempotencyKey = `chatgpt:${requestId}`;
  const { data: prior } = await service.from('articles').select('id,slug,status')
    .eq('legacy_id', idempotencyKey).maybeSingle();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, '');
  if (prior) {
    await service.from('api_devices').update({ last_used_at: new Date().toISOString() }).eq('id', device.id);
    return NextResponse.json({
      success: true, duplicate: true, article_id: prior.id, status: prior.status,
      edit_url: `${siteUrl}/admin/articles/${prior.id}`,
    });
  }

  const { data: duplicateSlug } = await service.from('articles').select('id').eq('slug', slug).maybeSingle();
  if (duplicateSlug) return NextResponse.json({ error: '这个 Slug 已存在，请在发送前更换 Slug' }, { status: 409 });

  let categoryId: string | null = null;
  if (categorySlug) {
    const { data: category } = await service.from('categories').select('id')
      .eq('kind', 'article').eq('slug', categorySlug).eq('active', true).maybeSingle();
    if (!category) return NextResponse.json({ error: `文章分类不存在：${categorySlug}` }, { status: 422 });
    categoryId = category.id;
  }

  let tags: Array<{ id: string; slug: string }> = [];
  if (tagSlugs.length) {
    const { data: foundTags } = await service.from('tags').select('id,slug').in('slug', tagSlugs).eq('active', true);
    tags = foundTags || [];
    const foundSlugs = new Set(tags.map(tag => tag.slug));
    const missing = tagSlugs.filter(tag => !foundSlugs.has(tag));
    if (missing.length) return NextResponse.json({ error: `以下标签尚未建立：${missing.join('、')}` }, { status: 422 });
  }

  const path = articleMarkdownPath(slug);
  let saved;
  try {
    saved = await writeMarkdownFile(path, markdown, `Import article from ChatGPT: ${title}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'GitHub 正文写入失败';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const contentHash = hashMarkdown(markdown);
  const { data: article, error: insertError } = await service.from('articles').insert({
    legacy_id: idempotencyKey,
    title, slug, excerpt, category_id: categoryId, author_id: device.user_id,
    status: 'draft', featured: false, published_at: null,
    github_path: path, github_sha: saved.commitSha, content_hash: contentHash,
  }).select('id').single();

  if (insertError || !article) {
    return NextResponse.json({
      error: 'Markdown 已写入 GitHub，但文章元数据同步失败；请使用相同 request_id 重试',
      github_path: path, sync_pending: true,
    }, { status: 502 });
  }

  let tagsSaved = true;
  if (tags.length) {
    const { error } = await service.from('article_tags').insert(tags.map(tag => ({ article_id: article.id, tag_id: tag.id })));
    tagsSaved = !error;
  }
  const revision = await service.from('article_revisions').insert({
    article_id: article.id, editor_id: device.user_id, title, excerpt,
    github_path: path, github_sha: saved.commitSha, content_hash: contentHash,
  });
  await service.from('audit_logs').insert({
    actor_id: device.user_id, action: 'article.import', entity_type: 'article', entity_id: article.id,
    details: { source: 'chatgpt', api_device_id: device.id, github_path: path, github_sha: saved.commitSha, tags_saved: tagsSaved, revision_saved: !revision.error },
  });
  await service.from('api_devices').update({ last_used_at: new Date().toISOString() }).eq('id', device.id);

  const editUrl = `${siteUrl}/admin/articles/${article.id}`;
  return NextResponse.json({
    success: true, article_id: article.id, status: 'draft',
    github_path: path, edit_url: editUrl,
    warnings: [!tagsSaved ? '标签关联保存失败' : '', revision.error ? '版本索引保存失败' : ''].filter(Boolean),
  }, { status: 201 });
}
