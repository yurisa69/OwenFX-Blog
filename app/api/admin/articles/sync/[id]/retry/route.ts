import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { authorizeContentEditor } from '@/lib/admin-api';
import { deleteMarkdownFile, hashMarkdown, readLatestMarkdownCommitSha, readMarkdownFileFresh } from '@/lib/github-articles';
import { claimArticleSyncJob, updateArticleSyncJob, acquireArticleSyncLock, releaseArticleSyncLock } from '@/lib/article-sync';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeContentEditor();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const service = createServiceClient();

  const { data: rawJob, error: jobError } = await service.rpc('get_article_sync_job', { p_id: id });
  if (jobError || !rawJob || typeof rawJob !== 'object' || Array.isArray(rawJob)) {
    return NextResponse.json({ error: '同步任务不存在' }, { status: 404 });
  }
  const job = rawJob as Record<string, unknown>;
  if (!['pending', 'github_written', 'failed'].includes(String(job.state))) {
    return NextResponse.json({ error: '该任务当前状态不可重试', state: job.state }, { status: 409 });
  }
  let claimed;
  try {
    claimed = await claimArticleSyncJob(service, id);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '领取任务失败' }, { status: 503 });
  }
  if (!claimed) return NextResponse.json({ error: '任务正在被其他执行者处理，请稍后重试' }, { status: 409 });

  const metadata = (job.metadata && typeof job.metadata === 'object' && !Array.isArray(job.metadata)
    ? job.metadata : {}) as Record<string, unknown>;
  const articleId = typeof job.article_id === 'string' ? job.article_id : null;
  const needsArticleLock = (job.operation === 'update' || job.operation === 'restore') && Boolean(articleId);
  let articleLockAcquired = false;
  let lockedArticle: { sync_job_id: string | null; updated_at: string } | null = null;
  try {
    if (needsArticleLock && articleId) {
      articleLockAcquired = await acquireArticleSyncLock(service, articleId, id, claimed.leaseToken);
      if (!articleLockAcquired) {
        await updateArticleSyncJob(service, id, claimed.leaseToken, 'failed', { error: '该文章正由另一个同步任务处理，请稍后重试。' });
        return NextResponse.json({ error: '该文章正由另一个同步任务处理，请稍后重试。' }, { status: 409 });
      }
      const { data: current, error: currentError } = await service.from('articles')
        .select('sync_job_id,updated_at').eq('id', articleId).maybeSingle();
      if (currentError) throw new Error(currentError.message);
      if (!current) throw new Error('目标文章不存在，无法补偿');
      lockedArticle = current;
      const baseJobId = typeof metadata.base_article_sync_job_id === 'string' ? metadata.base_article_sync_job_id : null;
      const baseUpdatedAt = typeof metadata.base_article_updated_at === 'string' ? metadata.base_article_updated_at : null;
      if (current.sync_job_id !== id && current.sync_job_id !== baseJobId) {
        await updateArticleSyncJob(service, id, claimed.leaseToken, 'conflict', { error: '目标文章已由其他同步任务更新，拒绝使用旧任务覆盖新版本。' });
        return NextResponse.json({ error: '文章已被更新的同步任务修改；为避免回滚新内容，已停止补偿。' }, { status: 409 });
      }
      if (baseUpdatedAt && current.sync_job_id !== id && current.updated_at !== baseUpdatedAt) {
        await updateArticleSyncJob(service, id, claimed.leaseToken, 'conflict', { error: '目标文章版本时间已变化，拒绝使用旧任务覆盖新版本。' });
        return NextResponse.json({ error: '文章版本已变化，已停止旧任务补偿。' }, { status: 409 });
      }
    }
    const file = await readMarkdownFileFresh(String(job.target_path));
    if (!file && (job.state === 'pending' || job.state === 'failed')) {
      await updateArticleSyncJob(service, id, claimed.leaseToken, 'failed', {
        error: '任务没有保存 Markdown 正文，且 GitHub 文件尚未写入；请通过原始创建/编辑/导入请求携带正文重试。',
      });
      return NextResponse.json({ error: 'GitHub 正文尚未写入。请通过原始请求携带正文重试。', requires_original_request: true }, { status: 409 });
    }
    if (!file || hashMarkdown(file.content) !== job.content_hash) {
      await updateArticleSyncJob(service, id, claimed.leaseToken, 'conflict', {
        error: 'GitHub 当前文件不存在或内容哈希与任务预期不一致；为避免覆盖新版本，已停止自动补偿。',
      });
      return NextResponse.json({ error: 'GitHub 正文与任务预期不一致，已标记冲突，未修改文章元数据。' }, { status: 409 });
    }

    let commitSha = typeof job.github_sha === 'string' ? job.github_sha : null;
    if (!commitSha) commitSha = await readLatestMarkdownCommitSha(String(job.target_path), file.sha);
    if (!commitSha) throw new Error('GitHub 正文存在，但无法确认对应提交 SHA；请稍后重试');
    if (job.state !== 'github_written' || !job.github_sha) {
      await updateArticleSyncJob(service, id, claimed.leaseToken, 'github_written', { githubSha: commitSha });
    }

    const articleValues = {
      title: String(metadata.title || ''),
      slug: String(metadata.slug || ''),
      excerpt: String(metadata.excerpt || ''),
      status: String(metadata.status || 'draft'),
      category_id: typeof metadata.category_id === 'string' ? metadata.category_id : null,
      author_id: typeof metadata.author_id === 'string' ? metadata.author_id : null,
      github_path: String(job.target_path),
      github_sha: commitSha,
      content_hash: String(job.content_hash),
      published_at: typeof metadata.published_at === 'string' ? metadata.published_at : null,
      updated_at: new Date().toISOString(),
      sync_job_id: id,
    };

    let resolvedArticleId = articleId;
    if ((job.operation === 'update' || job.operation === 'restore') && !articleId) {
      throw new Error('更新任务缺少 article_id，无法安全补偿');
    }
    if (job.operation === 'create' || job.operation === 'import') {
      const insertValues = { ...articleValues, ...(typeof metadata.legacy_id === 'string' ? { legacy_id: metadata.legacy_id } : {}) };
      const { data: existingArticle, error: lookupError } = await service.from('articles')
        .select('id').eq('sync_job_id', id).maybeSingle();
      if (lookupError) throw new Error(lookupError.message);
      const { data, error } = existingArticle
        ? await service.from('articles').update(insertValues).eq('id', existingArticle.id).select('id').single()
        : await service.from('articles').insert(insertValues).select('id').single();
      if (error || !data) throw new Error(error?.message || '补偿创建文章记录失败');
      resolvedArticleId = data.id;
    } else {
      if (!articleId) throw new Error('更新任务缺少 article_id，无法安全补偿');
      let articleUpdate = service.from('articles').update(articleValues).eq('id', articleId)
        .eq('updated_at', lockedArticle?.updated_at || '');
      articleUpdate = lockedArticle?.sync_job_id
        ? articleUpdate.eq('sync_job_id', lockedArticle.sync_job_id)
        : articleUpdate.is('sync_job_id', null);
      const { data, error } = await articleUpdate.select('id').maybeSingle();
      if (error || !data) throw new Error(error?.message || '文章版本已变化，拒绝使用旧任务覆盖');
      resolvedArticleId = data.id;
    }

    if (!resolvedArticleId) throw new Error('无法确定补偿后的文章 ID');
    const revisionValues = {
      article_id: resolvedArticleId,
      editor_id: typeof metadata.editor_id === 'string' ? metadata.editor_id : auth.user.id,
      title: articleValues.title,
      excerpt: articleValues.excerpt,
      github_path: articleValues.github_path,
      github_sha: articleValues.github_sha,
      content_hash: articleValues.content_hash,
      content_markdown: '',
      sync_job_id: id,
    };
    const { data: existingRevision, error: revisionLookupError } = await service.from('article_revisions')
      .select('id').eq('sync_job_id', id).maybeSingle();
    if (revisionLookupError) throw new Error(revisionLookupError.message);
    const { error: revisionError } = existingRevision
      ? await service.from('article_revisions').update(revisionValues).eq('id', existingRevision.id)
      : await service.from('article_revisions').insert(revisionValues);
    if (revisionError) throw new Error(`文章元数据已补偿，但版本索引仍失败：${revisionError.message}`);

    const tags = Array.isArray(metadata.tag_ids) ? metadata.tag_ids.filter((v): v is string => typeof v === 'string') : [];
    if (tags.length) {
      const { error: tagError } = await service.from('article_tags')
        .upsert(tags.map(tag_id => ({ article_id: resolvedArticleId, tag_id })), { onConflict: 'article_id,tag_id', ignoreDuplicates: true });
      if (tagError) throw new Error(`文章已补偿，但标签关联失败：${tagError.message}`);
    }

    const { data: existingAudit } = await service.from('audit_logs').select('id')
      .eq('entity_type', 'article').eq('entity_id', resolvedArticleId)
      .contains('details', { sync_job_id: id }).maybeSingle();
    if (!existingAudit) {
      await service.from('audit_logs').insert({
        actor_id: typeof metadata.editor_id === 'string' ? metadata.editor_id : auth.user.id,
        action: `article.sync.${String(job.operation)}`, entity_type: 'article', entity_id: resolvedArticleId,
        details: { sync_job_id: id, github_path: job.target_path, github_sha: commitSha },
      });
    }

    await updateArticleSyncJob(service, id, claimed.leaseToken, 'completed', { articleId: resolvedArticleId, githubSha: commitSha });
    const previousPath = typeof metadata.previous_path === 'string' ? metadata.previous_path : null;
    const previousBlobSha = typeof metadata.previous_blob_sha === 'string' ? metadata.previous_blob_sha : null;
    if (previousPath && previousPath !== String(job.target_path) && previousBlobSha) {
      try {
        const oldFile = await readMarkdownFileFresh(previousPath);
        if (oldFile && oldFile.sha === previousBlobSha) {
          await deleteMarkdownFile(previousPath, oldFile.sha, `Move article to ${String(job.target_path)}`);
        }
      } catch (cleanupError) { console.error('[article-file-cleanup]', cleanupError); }
    }
    revalidateTag('github-articles', { expire: 0 });
    return NextResponse.json({ success: true, article_id: resolvedArticleId, state: 'completed', github_blob_sha: file.sha });
  } catch (error) {
    const message = error instanceof Error ? error.message : '补偿失败';
    try { await updateArticleSyncJob(service, id, claimed.leaseToken, 'failed', { error: message }); } catch {}
    return NextResponse.json({ error: message, sync_pending: true }, { status: 502 });
  } finally {
    if (articleLockAcquired && articleId) {
      try { await releaseArticleSyncLock(service, articleId, id, claimed.leaseToken); }
      catch (releaseError) { console.error('[article-sync-lock-release]', releaseError); }
    }
  }
}
