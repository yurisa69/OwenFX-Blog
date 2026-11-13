import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { authorizeContentEditor } from '@/lib/admin-api';
import { articleMarkdownCacheTag, articleMarkdownPath, deleteMarkdownFile, hashMarkdown, readLatestMarkdownCommitSha, readMarkdownFileFresh, validateMarkdownImageUrls, writeMarkdownFile } from '@/lib/github-articles';
import { createArticleSyncJob, claimArticleSyncJob, updateArticleSyncJob, acquireArticleSyncLock, releaseArticleSyncLock } from '@/lib/article-sync';
import { createServiceClient } from '@/lib/supabase/service';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeContentEditor();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const { data, error } = await auth.supabase.from('articles').select('*').eq('id', id).single();
  if (error || !data) return NextResponse.json({ error: '文章不存在' }, { status: 404 });
  let content = '';
  if (data.github_path) {
    const file = await readMarkdownFileFresh(data.github_path);
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
  const expectedBlobSha = typeof input?.github_blob_sha === 'string' && input.github_blob_sha.length > 0 ? input.github_blob_sha : null;
  if (!expectedBlobSha) return NextResponse.json({ error: '编辑器缺少文章版本标识，请刷新页面后重试。' }, { status: 428 });
  if (!title || title.length > 160 || !slugPattern.test(slug) || slug.length > 180) return NextResponse.json({ error: '请检查标题和 Slug 格式' }, { status: 400 });
  if (status === 'published' && !content.trim()) return NextResponse.json({ error: '发布前请先填写文章正文' }, { status: 400 });
  if (content.length > 500000) return NextResponse.json({ error: '文章内容过大' }, { status: 413 });
  const imageError = validateMarkdownImageUrls(content);
  if (imageError) return NextResponse.json({ error: imageError }, { status: 422 });

  const { data: previous, error: readError } = await auth.supabase.from('articles')
    .select('id,title,excerpt,slug,github_path,github_sha,content_hash,published_at,author_id,category_id,updated_at,sync_job_id')
    .eq('id', id).maybeSingle();
  if (readError || !previous) return NextResponse.json({ error: '文章不存在' }, { status: 404 });
  if (!previous.github_path) return NextResponse.json({ error: '文章缺少 GitHub 正文路径，请先检查文章记录。' }, { status: 409 });
  const path = articleMarkdownPath(slug);
  const { data: duplicate } = await auth.supabase.from('articles').select('id').eq('slug', slug).neq('id', id).maybeSingle();
  if (duplicate) return NextResponse.json({ error: '这个 Slug 已被使用' }, { status: 409 });

  const service = createServiceClient();
  const contentHash = hashMarkdown(content);
  const publishedAt = status === 'published' ? (previous.published_at || new Date().toISOString()) : null;
  let job;
  let lease;
  let articleLockAcquired = false;
  try {
    const current = await readMarkdownFileFresh(previous.github_path);
    if (!current || current.sha !== expectedBlobSha) {
      return NextResponse.json({ error: '文章已被其他编辑操作更新，请刷新页面并重新载入最新内容。' }, { status: 409 });
    }
    job = await createArticleSyncJob(service, {
      idempotencyKey: `admin:update:${id}:${previous.updated_at}:${expectedBlobSha}:${path}:${contentHash}`,
      operation: 'update', articleId: id, actorId: auth.user.id, targetPath: path, contentHash,
      metadata: { title, slug, excerpt, status, editor_id: auth.user.id,
        published_at: publishedAt, base_github_sha: previous.github_sha, previous_path: previous.github_path,
        previous_blob_sha: expectedBlobSha, base_article_updated_at: previous.updated_at,
        base_article_sync_job_id: previous.sync_job_id, author_id: previous.author_id, category_id: previous.category_id },
    });
    if (job.state === 'completed') {
      const latest = await readMarkdownFileFresh(path);
      if (!latest || hashMarkdown(latest.content) !== contentHash) {
        return NextResponse.json({ error: '这次保存任务已经完成，但文章随后又发生变化；请刷新后继续编辑。' }, { status: 409 });
      }
      return NextResponse.json({ success: true, sync_job_id: job.id, duplicate: true, github_blob_sha: latest.sha });
    }
    lease = await claimArticleSyncJob(service, job.id);
    if (!lease) return NextResponse.json({ error: '该同步任务正在处理中，请稍后重试', sync_job_id: job.id }, { status: 409 });

    const lockAcquired = await acquireArticleSyncLock(service, id, job.id, lease.leaseToken);
    if (!lockAcquired) {
      await updateArticleSyncJob(service, job.id, lease.leaseToken, 'failed', { error: '该文章正由另一个同步任务处理，请稍后重试。' });
      return NextResponse.json({ error: '该文章正由另一个同步任务处理，请稍后重试。', sync_job_id: job.id }, { status: 409 });
    }
    articleLockAcquired = true;
    const { data: lockedArticle, error: lockedArticleError } = await service.from('articles')
      .select('updated_at,sync_job_id,github_path').eq('id', id).maybeSingle();
    if (lockedArticleError) throw new Error(lockedArticleError.message);
    if (!lockedArticle || lockedArticle.updated_at !== previous.updated_at
      || lockedArticle.sync_job_id !== previous.sync_job_id || lockedArticle.github_path !== previous.github_path) {
      await updateArticleSyncJob(service, job.id, lease.leaseToken, 'conflict', { error: '文章基准版本已变化，拒绝执行旧任务。' });
      return NextResponse.json({ error: '文章已被其他同步任务更新，请刷新后重试。', sync_job_id: job.id }, { status: 409 });
    }

    let commitSha = job.github_sha;
    let blobSha = '';
    const latest = await readMarkdownFileFresh(path);
    if (latest) {
      if (hashMarkdown(latest.content) !== contentHash) {
        await updateArticleSyncJob(service, job.id, lease.leaseToken, 'conflict', { error: 'GitHub 文件哈希与任务不符' });
        return NextResponse.json({ error: 'GitHub 目标文件已存在不同内容，已停止自动覆盖', sync_job_id: job.id }, { status: 409 });
      }
      blobSha = latest.sha;
      commitSha = job.github_sha || await readLatestMarkdownCommitSha(path, latest.sha);
      if (!commitSha) throw new Error('GitHub 正文存在，但无法确认对应提交 SHA；请稍后重试');
      if (job.state !== 'github_written' || !job.github_sha) {
        await updateArticleSyncJob(service, job.id, lease.leaseToken, 'github_written', { githubSha: commitSha });
      }
    } else {
      if (job.state === 'github_written') {
        await updateArticleSyncJob(service, job.id, lease.leaseToken, 'conflict', { error: '任务标记 GitHub 已写入，但目标文件不存在' });
        return NextResponse.json({ error: '任务记录与 GitHub 文件状态不一致，已标记冲突', sync_job_id: job.id }, { status: 409 });
      }
      const targetExpected = previous.github_path === path ? expectedBlobSha : null;
      const saved = await writeMarkdownFile(path, content, `Update article: ${title}`, { expectedBlobSha: targetExpected });
      commitSha = saved.commitSha; blobSha = saved.blobSha;
      await updateArticleSyncJob(service, job.id, lease.leaseToken, 'github_written', { githubSha: commitSha });
    }

    let articleUpdate = service.from('articles').update({
      title, slug, excerpt, status, github_path: path, github_sha: commitSha,
      content_hash: contentHash, published_at: publishedAt, updated_at: new Date().toISOString(),
      sync_job_id: job.id,
    }).eq('id', id).eq('updated_at', previous.updated_at);
    articleUpdate = previous.sync_job_id
      ? articleUpdate.eq('sync_job_id', previous.sync_job_id)
      : articleUpdate.is('sync_job_id', null);
    const { data: updatedArticle, error } = await articleUpdate.select('id').maybeSingle();
    if (error) throw new Error(`正文已提交 GitHub，但文章元数据同步失败：${error.message}`);
    if (!updatedArticle) {
      await updateArticleSyncJob(service, job.id, lease.leaseToken, 'conflict', { error: '文章元数据版本条件不匹配，拒绝覆盖。' });
      return NextResponse.json({ error: '文章元数据已变化，已停止旧任务写入。', sync_job_id: job.id }, { status: 409 });
    }
    const revisionValues = {
      article_id: id, editor_id: auth.user.id, title, excerpt, content_markdown: '',
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
      .eq('entity_type', 'article').eq('entity_id', id)
      .contains('details', { sync_job_id: job.id }).maybeSingle();
    if (!existingAudit) {
      await service.from('audit_logs').insert({
        actor_id: auth.user.id, action: status === 'published' ? 'article.publish' : 'article.update', entity_type: 'article', entity_id: id,
        details: { sync_job_id: job.id, storage: 'github', github_path: path, github_sha: commitSha },
      });
    }
    await updateArticleSyncJob(service, job.id, lease.leaseToken, 'completed', { articleId: id, githubSha: commitSha });
    revalidateTag(articleMarkdownCacheTag(path), { expire: 0 });
    if (previous.github_path !== path) revalidateTag(articleMarkdownCacheTag(previous.github_path), { expire: 0 });

    if (previous.github_path !== path) {
      try {
        const oldFile = await readMarkdownFileFresh(previous.github_path);
        if (oldFile && oldFile.sha === expectedBlobSha) await deleteMarkdownFile(previous.github_path, oldFile.sha, `Move article to ${path}`);
      } catch (cleanupError) { console.error('[article-file-cleanup]', cleanupError); }
    }
    return NextResponse.json({ success: true, github_path: path, github_sha: commitSha, github_blob_sha: blobSha, sync_job_id: job.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : '文章同步失败';
    if (job && lease) {
      try { await updateArticleSyncJob(service, job.id, lease.leaseToken, 'failed', { error: message }); } catch {}
    }
    return NextResponse.json({ error: message, sync_pending: Boolean(job), sync_job_id: job?.id }, { status: 502 });
  } finally {
    if (articleLockAcquired && job?.id && lease?.leaseToken) {
      try { await releaseArticleSyncLock(service, id, job.id, lease.leaseToken); }
      catch (releaseError) { console.error('[article-sync-lock-release]', releaseError); }
    }
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeContentEditor();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const { data: archived, error } = await auth.supabase.from('articles')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id).select('github_path').maybeSingle();
  if (error) return NextResponse.json({ error: '归档失败' }, { status: 400 });
  await auth.supabase.from('audit_logs').insert({ actor_id: auth.user.id, action: 'article.archive', entity_type: 'article', entity_id: id });
  if (archived?.github_path) revalidateTag(articleMarkdownCacheTag(archived.github_path), { expire: 0 });
  return NextResponse.json({ success: true });
}
