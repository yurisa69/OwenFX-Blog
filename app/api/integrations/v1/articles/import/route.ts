import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { articleMarkdownPath, hashMarkdown, readLatestMarkdownCommitSha, readMarkdownFileFresh, validateMarkdownImageUrls, writeMarkdownFile } from '@/lib/github-articles';
import { createArticleSyncJob, claimArticleSyncJob, updateArticleSyncJob } from '@/lib/article-sync';
import { createRateLimitBucketKey, readLimitedRequestBody } from '@/lib/api-rate-limit';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const requestIdPattern = /^[a-zA-Z0-9._:-]{8,120}$/;
const MAX_IMPORT_BODY_BYTES = 1_600_000;

export async function POST(request: Request) {
  const authorization = request.headers.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token || !token.startsWith('owfx_')) {
    return NextResponse.json({ error: '缺少有效的 OwenFX 导入授权' }, { status: 401 });
  }

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

  const bucketKey = createRateLimitBucketKey('integration-article-import', device.id);
  const { data: withinLimit, error: rateError } = await service.rpc('consume_api_rate_limit', {
    p_bucket_key: bucketKey,
    p_limit: 10,
    p_window_seconds: 60,
  });
  if (rateError) return NextResponse.json({ error: '导入服务暂时不可用，请稍后重试。' }, { status: 503 });
  if (withinLimit !== true) {
    return NextResponse.json({ error: '该授权设备导入过于频繁，请稍后再试。' }, {
      status: 429,
      headers: { 'Retry-After': '60' },
    });
  }

  const raw = await readLimitedRequestBody(request, MAX_IMPORT_BODY_BYTES);
  if (raw === null) return NextResponse.json({ error: '导入请求超过 1.6 MB 限制。' }, { status: 413 });

  let input: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json({ error: '请求必须是 JSON 对象。' }, { status: 400 });
    }
    input = parsed as Record<string, unknown>;
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
  const imageError = validateMarkdownImageUrls(markdown);
  if (imageError) return NextResponse.json({ error: imageError }, { status: 422 });
  if (!requestIdPattern.test(requestId)) return NextResponse.json({ error: 'request_id 必须为 8 至 120 位字母、数字或 . _ : -' }, { status: 400 });

  const idempotencyKey = `chatgpt:${requestId}`;
  const taskIdempotencyKey = `chatgpt:${device.id}:${requestId}`;
  const { data: prior } = await service.from('articles').select('id,slug,status,sync_job_id')
    .eq('legacy_id', idempotencyKey).maybeSingle();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, '');
  if (prior) {
    if (!prior.sync_job_id) {
      await service.from('api_devices').update({ last_used_at: new Date().toISOString() }).eq('id', device.id);
      return NextResponse.json({
        success: true, duplicate: true, article_id: prior.id, status: prior.status,
        edit_url: `${siteUrl}/admin/articles/${prior.id}`,
      });
    }
    const { data: priorJob, error: priorJobError } = await service.rpc('get_article_sync_job', { p_id: prior.sync_job_id });
    if (priorJobError) return NextResponse.json({ error: '无法检查已有同步任务，请稍后重试' }, { status: 503 });
    const jobRecord = priorJob && typeof priorJob === 'object' && !Array.isArray(priorJob)
      ? priorJob as Record<string, unknown> : null;
    if (jobRecord?.state === 'completed') {
      await service.from('api_devices').update({ last_used_at: new Date().toISOString() }).eq('id', device.id);
      return NextResponse.json({
        success: true, duplicate: true, article_id: prior.id, status: prior.status,
        edit_url: `${siteUrl}/admin/articles/${prior.id}`,
      });
    }
    if (jobRecord?.idempotency_key !== taskIdempotencyKey
      || !['pending', 'github_written', 'failed'].includes(String(jobRecord?.state))) {
      return NextResponse.json({ error: '该 request_id 对应的导入任务无法自动恢复，请检查同步任务状态。' }, { status: 409 });
    }
  }

  const { data: duplicateSlug } = await service.from('articles').select('id').eq('slug', slug).maybeSingle();
  if (duplicateSlug && duplicateSlug.id !== prior?.id) {
    return NextResponse.json({ error: '这个 Slug 已存在，请在发送前更换 Slug' }, { status: 409 });
  }

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
  const contentHash = hashMarkdown(markdown);
  const idempotencyKey = taskIdempotencyKey;
  let job;
  let lease;
  try {
    job = await createArticleSyncJob(service, {
      idempotencyKey, operation: 'import', actorId: device.user_id,
      targetPath: path, contentHash,
      metadata: { legacy_id: `chatgpt:${requestId}`, title, slug, excerpt, status: 'draft',
        category_id: categoryId, author_id: device.user_id, editor_id: device.user_id,
        published_at: null, tag_ids: tags.map(tag => tag.id), api_device_id: device.id },
    });
    if (job.state === 'completed' && job.article_id) {
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, '');
      await service.from('api_devices').update({ last_used_at: new Date().toISOString() }).eq('id', device.id);
      return NextResponse.json({ success: true, duplicate: true, article_id: job.article_id,
        status: 'draft', edit_url: `${siteUrl}/admin/articles/${job.article_id}` });
    }
    lease = await claimArticleSyncJob(service, job.id);
    if (!lease) return NextResponse.json({ error: '该导入任务正在处理中，请稍后重试', sync_job_id: job.id }, { status: 409 });

    let commitSha = job.github_sha;
    const current = await readMarkdownFileFresh(path);
    if (current) {
      if (hashMarkdown(current.content) !== contentHash) {
        await updateArticleSyncJob(service, job.id, lease.leaseToken, 'conflict', { error: 'GitHub 文件哈希与任务不符' });
        return NextResponse.json({ error: 'GitHub 目标文件已存在不同内容，已停止自动覆盖', sync_job_id: job.id }, { status: 409 });
      }
      commitSha = job.github_sha || await readLatestMarkdownCommitSha(path, current.sha);
      if (!commitSha) throw new Error('GitHub 正文存在，但无法确认对应提交 SHA；请稍后重试');
      if (job.state !== 'github_written' || !job.github_sha) {
        await updateArticleSyncJob(service, job.id, lease.leaseToken, 'github_written', { githubSha: commitSha });
      }
    } else {
      if (job.state === 'github_written') {
        await updateArticleSyncJob(service, job.id, lease.leaseToken, 'conflict', { error: '任务标记 GitHub 已写入，但目标文件不存在' });
        return NextResponse.json({ error: '任务记录与 GitHub 文件状态不一致，已标记冲突', sync_job_id: job.id }, { status: 409 });
      }
      const saved = await writeMarkdownFile(path, markdown, `Import article from ChatGPT: ${title}`, { expectedBlobSha: null });
      commitSha = saved.commitSha;
      await updateArticleSyncJob(service, job.id, lease.leaseToken, 'github_written', { githubSha: commitSha });
    }

    const articleValues = {
      legacy_id: `chatgpt:${requestId}`, title, slug, excerpt, category_id: categoryId,
      author_id: device.user_id, status: 'draft', featured: false, published_at: null,
      github_path: path, github_sha: commitSha, content_hash: contentHash, sync_job_id: job.id,
    };
    const { data: existingArticle, error: lookupError } = await service.from('articles')
      .select('id').eq('sync_job_id', job.id).maybeSingle();
    if (lookupError) throw new Error(lookupError.message);
    const { data: article, error: insertError } = existingArticle
      ? await service.from('articles').update(articleValues).eq('id', existingArticle.id).select('id').single()
      : await service.from('articles').insert(articleValues).select('id').single();
    if (insertError || !article) throw new Error(insertError?.message || '文章元数据同步失败');

    if (tags.length) {
      const { error: tagsError } = await service.from('article_tags')
        .upsert(tags.map(tag => ({ article_id: article.id, tag_id: tag.id })), { onConflict: 'article_id,tag_id', ignoreDuplicates: true });
      if (tagsError) throw new Error(`文章已创建，但标签关联失败：${tagsError.message}`);
    }
    const revisionValues = {
      article_id: article.id, editor_id: device.user_id, title, excerpt, content_markdown: '',
      github_path: path, github_sha: commitSha, content_hash: contentHash, sync_job_id: job.id,
    };
    const { data: existingRevision, error: revisionLookupError } = await service.from('article_revisions')
      .select('id').eq('sync_job_id', job.id).maybeSingle();
    if (revisionLookupError) throw new Error(revisionLookupError.message);
    const { error: revisionError } = existingRevision
      ? await service.from('article_revisions').update(revisionValues).eq('id', existingRevision.id)
      : await service.from('article_revisions').insert(revisionValues);
    if (revisionError) throw new Error(`文章已创建，但版本索引失败：${revisionError.message}`);

    const { data: existingAudit } = await service.from('audit_logs').select('id')
      .eq('entity_type', 'article').eq('entity_id', article.id)
      .contains('details', { sync_job_id: job.id }).maybeSingle();
    if (!existingAudit) {
      await service.from('audit_logs').insert({
        actor_id: device.user_id, action: 'article.import', entity_type: 'article', entity_id: article.id,
        details: { sync_job_id: job.id, source: 'chatgpt', api_device_id: device.id, github_path: path, github_sha: commitSha },
      });
    }
    await service.from('api_devices').update({ last_used_at: new Date().toISOString() }).eq('id', device.id);
    await updateArticleSyncJob(service, job.id, lease.leaseToken, 'completed', { articleId: article.id, githubSha: commitSha });

    const editUrl = `${siteUrl}/admin/articles/${article.id}`;
    return NextResponse.json({ success: true, article_id: article.id, status: 'draft',
      github_path: path, edit_url: editUrl, sync_job_id: job.id, warnings: [] }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '导入同步失败';
    if (job && lease) { try { await updateArticleSyncJob(service, job.id, lease.leaseToken, 'failed', { error: message }); } catch {} }
    return NextResponse.json({ error: message, github_path: path, sync_pending: Boolean(job), sync_job_id: job?.id }, { status: 502 });
  }
}