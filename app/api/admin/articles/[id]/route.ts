import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { authorizeContentEditor } from '@/lib/admin-api';
import { articleMarkdownCacheTag, articleMarkdownPath, deleteMarkdownFile, hashMarkdown, readLatestMarkdownCommitSha, readMarkdownFileFresh, validateMarkdownImageUrls, writeMarkdownFile } from '@/lib/github-articles';
import { createArticleSyncJob, claimArticleSyncJob, updateArticleSyncJob, acquireArticleSyncLock, releaseArticleSyncLock } from '@/lib/article-sync';
import { createServiceClient } from '@/lib/supabase/service';
import { validateArticleWriteInput } from '@/lib/article-input';
import { ensureArticleAuditLog, upsertArticleRevision } from '@/lib/article-records';
import { getArticleNumberingPublishError } from '@/lib/article-numbering';
import { associateArticleMediaAssets, deleteArticleMediaObjects } from '@/lib/r2-media';


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
  const validation = validateArticleWriteInput(input, 'update');
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: validation.status });
  const { title, slug, content, excerpt, status, expectedBlobSha } = validation.value;
  const requestId = typeof input?.request_id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.request_id)
    ? input.request_id : randomUUID();
  const imageError = validateMarkdownImageUrls(content);
  if (imageError) return NextResponse.json({ error: imageError }, { status: 422 });

  const { data: previous, error: readError } = await auth.supabase.from('articles')
    .select('id,title,excerpt,slug,github_path,github_sha,content_hash,published_at,author_id,category_id,status,archive_previous_status,updated_at,sync_job_id')
    .eq('id', id).maybeSingle();
  if (readError || !previous) return NextResponse.json({ error: '文章不存在' }, { status: 404 });
  if (previous.status === 'trashed') return NextResponse.json({ error: '文章在回收站中，请先恢复后再编辑。' }, { status: 409 });
  if (!previous.github_path) return NextResponse.json({ error: '文章缺少 GitHub 正文路径，请先检查文章记录。' }, { status: 409 });
  const nextStatus = previous.status === 'archived' ? 'archived' : status;
  const numberingError = getArticleNumberingPublishError(nextStatus, content);
  if (numberingError) return NextResponse.json(numberingError, { status: 422 });
  const path = articleMarkdownPath(slug);
  const { data: duplicate } = await auth.supabase.from('articles').select('id').eq('slug', slug).neq('id', id).maybeSingle();
  if (duplicate) return NextResponse.json({ error: '这个 Slug 已被使用' }, { status: 409 });

  const service = createServiceClient();
  const contentHash = hashMarkdown(content);
  const publishedAt = nextStatus === 'published' ? (previous.published_at || new Date().toISOString())
    : nextStatus === 'archived' ? previous.published_at : null;
  let job;
  let lease;
  let articleLockAcquired = false;
  try {
    const current = await readMarkdownFileFresh(previous.github_path);
    if (!current || current.sha !== expectedBlobSha) {
      return NextResponse.json({ error: '文章已被其他编辑操作更新，请刷新页面并重新载入最新内容。' }, { status: 409 });
    }
    const baseIdempotencyKey = `admin:update:${id}:${previous.updated_at}:${expectedBlobSha}:${path}:${contentHash}`;
    const syncJobInput = {
      operation: 'update' as const, articleId: id, actorId: auth.user.id, targetPath: path, contentHash,
      metadata: { title, slug, excerpt, status: nextStatus, editor_id: auth.user.id,
        published_at: publishedAt, base_github_sha: previous.github_sha, previous_path: previous.github_path,
        previous_blob_sha: expectedBlobSha, base_article_updated_at: previous.updated_at,
        base_article_sync_job_id: previous.sync_job_id, author_id: previous.author_id, category_id: previous.category_id },
    };
    job = await createArticleSyncJob(service, { ...syncJobInput, idempotencyKey: baseIdempotencyKey });
    // Conflict jobs are terminal. Only after revalidating the article's current GitHub SHA above,
    // create a request-scoped attempt so a stale terminal job cannot block a legitimate new save.
    if (job.state === 'conflict') {
      job = await createArticleSyncJob(service, {
        ...syncJobInput,
        idempotencyKey: `${baseIdempotencyKey}:attempt:${requestId}`,
      });
    }
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
    if (latest && hashMarkdown(latest.content) === contentHash) {
      // The GitHub write may have succeeded before a previous request failed to update Supabase.
      // Recognize that exact content and resume metadata synchronization without another write.
      blobSha = latest.sha;
      commitSha = job.github_sha || await readLatestMarkdownCommitSha(path, latest.sha);
      if (!commitSha) throw new Error('GitHub 正文存在，但无法确认对应提交 SHA；请稍后重试');
      if (job.state !== 'github_written' || !job.github_sha) {
        await updateArticleSyncJob(service, job.id, lease.leaseToken, 'github_written', { githubSha: commitSha });
      }
    } else if (latest && previous.github_path === path && latest.sha === expectedBlobSha && job.state !== 'github_written') {
      // Same-slug edits target the existing article file. Its old content is expected; update it
      // only when its blob SHA still matches the editor's freshly validated base version.
      const saved = await writeMarkdownFile(path, content, `Update article: ${title}`, { expectedBlobSha });
      commitSha = saved.commitSha;
      blobSha = saved.blobSha;
      await updateArticleSyncJob(service, job.id, lease.leaseToken, 'github_written', { githubSha: commitSha });
    } else if (latest) {
      await updateArticleSyncJob(service, job.id, lease.leaseToken, 'conflict', { error: 'GitHub 文件版本与文章基准版本不符' });
      return NextResponse.json({ error: 'GitHub 目标文件已发生其他变化，已停止自动覆盖', sync_job_id: job.id }, { status: 409 });
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
      title, slug, excerpt, status: nextStatus, github_path: path, github_sha: commitSha,
      content_hash: contentHash, published_at: publishedAt, updated_at: new Date().toISOString(),
      archive_previous_status: nextStatus === 'archived' ? previous.archive_previous_status : null,
      deleted_at: null, trash_previous_status: null,
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
    await upsertArticleRevision(service, revisionValues);
    await associateArticleMediaAssets(service, id, content);
    await ensureArticleAuditLog(service, {
      actor_id: auth.user.id, action: nextStatus === 'published' ? 'article.publish' : 'article.update', entity_type: 'article', entity_id: id,
      details: { sync_job_id: job.id, storage: 'github', github_path: path, github_sha: commitSha },
    });
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



export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeContentEditor();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const input = await req.json().catch(() => null);
  const action = typeof input?.action === 'string' ? input.action : '';
  const service = createServiceClient();
  const { data: article, error: readError } = await service.from('articles')
    .select('id,title,status,github_path,content_hash,archive_previous_status,trash_previous_status')
    .eq('id', id).maybeSingle();
  if (readError || !article) return NextResponse.json({ error: '文章不存在' }, { status: 404 });

  const now = new Date().toISOString();
  let updateValues: { status: string; archive_previous_status?: string | null; trash_previous_status?: string | null; deleted_at?: string | null; updated_at: string } | null = null;
  let auditAction = '';

  if (action === 'archive') {
    if (article.status !== 'draft' && article.status !== 'published') {
      return NextResponse.json({ error: '只有草稿或已发布文章可以归档。' }, { status: 409 });
    }
    updateValues = { status: 'archived', archive_previous_status: article.status, updated_at: now };
    auditAction = 'article.archive';
  } else if (action === 'restore_archive') {
    if (article.status !== 'archived') return NextResponse.json({ error: '这篇文章当前不在归档状态。' }, { status: 409 });
    updateValues = {
      status: article.archive_previous_status === 'draft' ? 'draft' : 'published',
      archive_previous_status: null,
      updated_at: now,
    };
    auditAction = 'article.restore_archive';
  } else if (action === 'restore_trash') {
    if (article.status !== 'trashed') return NextResponse.json({ error: '这篇文章不在回收站中。' }, { status: 409 });
    const restoredStatus = article.trash_previous_status === 'draft' || article.trash_previous_status === 'published' || article.trash_previous_status === 'archived'
      ? article.trash_previous_status : 'draft';
    updateValues = { status: restoredStatus, deleted_at: null, trash_previous_status: null, updated_at: now };
    auditAction = 'article.restore_trash';
  } else if (action === 'permanent_delete') {
    if (article.status !== 'trashed') return NextResponse.json({ error: '只能永久删除回收站中的文章。' }, { status: 409 });

    const deletionJobId = randomUUID();
    const deletionLeaseToken = randomUUID();
    let deletionLockAcquired = false;
    let githubFileDeleted = false;
    let mediaObjectsDeleted = 0;
    let stage = '获取文章同步锁';

    try {
      const lockAcquired = await acquireArticleSyncLock(service, id, deletionJobId, deletionLeaseToken);
      if (!lockAcquired) {
        return NextResponse.json({ error: '文章正在同步或删除，请稍后重试。' }, { status: 409 });
      }
      deletionLockAcquired = true;

      const { data: currentArticle, error: currentArticleError } = await service.from('articles')
        .select('id,title,status,github_path,content_hash')
        .eq('id', id).maybeSingle();
      if (currentArticleError) throw new Error('重新读取文章失败：' + currentArticleError.message);
      if (!currentArticle) return NextResponse.json({ error: '文章不存在' }, { status: 404 });
      if (currentArticle.status !== 'trashed') {
        return NextResponse.json({ error: '文章状态已变化，请刷新后重试。' }, { status: 409 });
      }

      stage = '读取文章媒体记录';
      const { data: mediaAssets, error: mediaError } = await service.from('media_assets')
        .select('id,bucket,object_key,public_url')
        .eq('entity_type', 'article').eq('entity_id', id);
      if (mediaError) throw new Error('读取文章媒体记录失败：' + mediaError.message);

      stage = '删除 GitHub 当前文章文件';
      if (currentArticle.github_path) {
        const currentFile = await readMarkdownFileFresh(currentArticle.github_path);
        if (currentFile) {
          if (currentArticle.content_hash && hashMarkdown(currentFile.content) !== currentArticle.content_hash) {
            return NextResponse.json({ error: 'GitHub 中的文章正文已发生变化，为保护数据已停止永久删除。' }, { status: 409 });
          }
          await deleteMarkdownFile(currentArticle.github_path, currentFile.sha, 'Permanently delete article: ' + currentArticle.title);
          githubFileDeleted = true;
        }
      }

      stage = '删除 Cloudflare R2 文章媒体对象';
      mediaObjectsDeleted = await deleteArticleMediaObjects(mediaAssets ?? []);

      stage = '清理 Supabase 文章数据及历史';
      const { data: cleanup, error: cleanupError } = await service.rpc('permanently_delete_article', {
        p_article_id: id,
        p_job_id: deletionJobId,
        p_lease_token: deletionLeaseToken,
      });
      if (cleanupError) throw new Error(cleanupError.message);
      if (!cleanup || typeof cleanup !== 'object' || cleanup.success !== true) {
        throw new Error('数据库清理函数未确认文章已完整删除');
      }

      if (currentArticle.github_path) revalidateTag(articleMarkdownCacheTag(currentArticle.github_path), { expire: 0 });
      return NextResponse.json({
        success: true,
        github_file_deleted: githubFileDeleted,
        media_objects_deleted: mediaObjectsDeleted,
        cleanup,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      console.error('[article-permanent-delete]', { articleId: id, stage, error: message });
      return NextResponse.json({
        error: '永久删除在「' + stage + '」阶段失败，请检查后重试。',
        details: message,
        github_file_deleted: githubFileDeleted,
        media_objects_deleted: mediaObjectsDeleted,
      }, { status: 502 });
    } finally {
      if (deletionLockAcquired) {
        try {
          await releaseArticleSyncLock(service, id, deletionJobId, deletionLeaseToken);
        } catch (releaseError) {
          console.error('[article-permanent-delete-lock-release]', releaseError);
        }
      }
    }  } else {
    return NextResponse.json({ error: '不支持的文章管理操作。' }, { status: 400 });
  }

  const { data: updated, error: updateError } = await service.from('articles')
    .update(updateValues).eq('id', id).eq('status', article.status)
    .select('id,github_path').maybeSingle();
  if (updateError || !updated) return NextResponse.json({ error: '文章状态更新失败，请刷新后重试。' }, { status: 409 });
  await service.from('audit_logs').insert({
    actor_id: auth.user.id, action: auditAction, entity_type: 'article', entity_id: id,
  });
  if (updated.github_path) revalidateTag(articleMarkdownCacheTag(updated.github_path), { expire: 0 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeContentEditor();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const service = createServiceClient();
  const { data: article, error: readError } = await service.from('articles')
    .select('id,status,github_path').eq('id', id).maybeSingle();
  if (readError || !article) return NextResponse.json({ error: '文章不存在' }, { status: 404 });
  if (article.status === 'trashed') return NextResponse.json({ error: '文章已经在回收站中。' }, { status: 409 });
  const { data: trashed, error } = await service.from('articles').update({
    status: 'trashed',
    deleted_at: new Date().toISOString(),
    trash_previous_status: article.status,
    updated_at: new Date().toISOString(),
  }).eq('id', id).eq('status', article.status).select('id,github_path').maybeSingle();
  if (error || !trashed) return NextResponse.json({ error: '移入回收站失败，请刷新后重试。' }, { status: 409 });
  await service.from('audit_logs').insert({
    actor_id: auth.user.id, action: 'article.trash', entity_type: 'article', entity_id: id,
  });
  if (trashed.github_path) revalidateTag(articleMarkdownCacheTag(trashed.github_path), { expire: 0 });
  return NextResponse.json({ success: true });
}
