import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { authorizeContentEditor } from '@/lib/admin-api';
import { articleMarkdownCacheTag, articleMarkdownPath, hashMarkdown, readLatestMarkdownCommitSha, readMarkdownFileFresh, validateMarkdownImageUrls, writeMarkdownFile } from '@/lib/github-articles';
import { createArticleSyncJob, claimArticleSyncJob, updateArticleSyncJob } from '@/lib/article-sync';
import { createServiceClient } from '@/lib/supabase/service';

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
  const service = createServiceClient();
  const path = articleMarkdownPath(slug);
  const contentHash = hashMarkdown(content);
  const idempotencyKey = `admin:create:${auth.user.id}:${path}:${contentHash}`;
  const { data: duplicate } = await auth.supabase.from('articles')
    .select('id,author_id,content_hash,sync_job_id').eq('slug', slug).maybeSingle();
  if (duplicate) {
    let recoverable = false;
    if (duplicate.sync_job_id && duplicate.author_id === auth.user.id && duplicate.content_hash === contentHash) {
      const { data: priorJob, error: priorJobError } = await service.rpc('get_article_sync_job', { p_id: duplicate.sync_job_id });
      if (priorJobError) return NextResponse.json({ error: '无法检查已有同步任务，请稍后重试' }, { status: 503 });
      if (priorJob && typeof priorJob === 'object' && !Array.isArray(priorJob)) {
        const jobRecord = priorJob as Record<string, unknown>;
        recoverable = jobRecord.idempotency_key === idempotencyKey
          && ['pending', 'github_written', 'failed'].includes(String(jobRecord.state));
      }
    }
    if (!recoverable) return NextResponse.json({ error: '这个 Slug 已被使用' }, { status: 409 });
  }
  let job;
  let lease;
  try {
    job = await createArticleSyncJob(service, {
      idempotencyKey, operation: 'create', actorId: auth.user.id, targetPath: path, contentHash,
      metadata: { title, slug, excerpt, status, author_id: auth.user.id, editor_id: auth.user.id,
        published_at: status === 'published' ? new Date().toISOString() : null },
    });
    if (job.state === 'completed') {
      return NextResponse.json({ success: true, id: job.article_id, sync_job_id: job.id, duplicate: true });
    }
    lease = await claimArticleSyncJob(service, job.id);
    if (!lease) return NextResponse.json({ error: '该同步任务正在处理中，请稍后重试', sync_job_id: job.id }, { status: 409 });

    let commitSha = job.github_sha;
    let blobSha = '';
    const current = await readMarkdownFileFresh(path);
    if (current) {
      if (hashMarkdown(current.content) !== contentHash) {
        await updateArticleSyncJob(service, job.id, lease.leaseToken, 'conflict', { error: 'GitHub 文件哈希与任务不符' });
        return NextResponse.json({ error: 'GitHub 目标文件已存在不同内容，已停止自动覆盖', sync_job_id: job.id }, { status: 409 });
      }
      blobSha = current.sha;
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
      const saved = await writeMarkdownFile(path, content, `Add article: ${title}`, { expectedBlobSha: null });
      commitSha = saved.commitSha; blobSha = saved.blobSha;
      await updateArticleSyncJob(service, job.id, lease.leaseToken, 'github_written', { githubSha: commitSha });
    }

    const articleValues = {
      title, slug, excerpt, status, author_id: auth.user.id, github_path: path,
      github_sha: commitSha, content_hash: contentHash,
      published_at: status === 'published' ? (job.metadata.published_at as string || new Date().toISOString()) : null,
      sync_job_id: job.id,
    };
    const { data: existingArticle, error: lookupError } = await service.from('articles')
      .select('id').eq('sync_job_id', job.id).maybeSingle();
    if (lookupError) throw new Error(lookupError.message);
    const { data, error } = existingArticle
      ? await service.from('articles').update(articleValues).eq('id', existingArticle.id).select('id').single()
      : await service.from('articles').insert(articleValues).select('id').single();
    if (error || !data) throw new Error(error?.message || '文章元数据保存失败');
    const revisionValues = {
      article_id: data.id, editor_id: auth.user.id, title, excerpt, content_markdown: '',
      github_path: path, github_sha: commitSha, content_hash: contentHash, sync_job_id: job.id,
    };
    const { data: existingRevision, error: revisionLookupError } = await service.from('article_revisions')
      .select('id').eq('sync_job_id', job.id).maybeSingle();
    if (revisionLookupError) throw new Error(revisionLookupError.message);
    const { error: revisionError } = existingRevision
      ? await service.from('article_revisions').update(revisionValues).eq('id', existingRevision.id)
      : await service.from('article_revisions').insert(revisionValues);
    if (revisionError) throw new Error(`文章已保存，但版本索引写入失败：${revisionError.message}`);
    const { data: existingAudit } = await service.from('audit_logs').select('id')
      .eq('entity_type', 'article').eq('entity_id', data.id)
      .contains('details', { sync_job_id: job.id }).maybeSingle();
    if (!existingAudit) {
      await service.from('audit_logs').insert({
        actor_id: auth.user.id, action: status === 'published' ? 'article.publish' : 'article.create', entity_type: 'article', entity_id: data.id,
        details: { sync_job_id: job.id, storage: 'github', github_path: path, github_sha: commitSha },
      });
    }
    await updateArticleSyncJob(service, job.id, lease.leaseToken, 'completed', { articleId: data.id, githubSha: commitSha });
    if (status === 'published') revalidateTag(articleMarkdownCacheTag(path), { expire: 0 });
    return NextResponse.json({ id: data.id, github_path: path, github_sha: commitSha, github_blob_sha: blobSha, sync_job_id: job.id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '文章同步失败';
    if (job && lease) {
      try { await updateArticleSyncJob(service, job.id, lease.leaseToken, 'failed', { error: message }); } catch {}
    }
    return NextResponse.json({ error: message, sync_pending: Boolean(job), sync_job_id: job?.id }, { status: 502 });
  }
}