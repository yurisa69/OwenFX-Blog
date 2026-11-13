import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { authorizeContentEditor } from '@/lib/admin-api';
import { articleMarkdownPath, hashMarkdown, readLatestMarkdownCommitSha, readMarkdownFileFresh, writeMarkdownFile } from '@/lib/github-articles';
import { createArticleSyncJob, claimArticleSyncJob, updateArticleSyncJob } from '@/lib/article-sync';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(_: Request, { params }: { params: Promise<{ id: string; revisionId: string }> }) {
  const auth = await authorizeContentEditor();
  if ('response' in auth) return auth.response;
  const { id, revisionId } = await params;
  const { data: article } = await auth.supabase.from('articles')
    .select('id,title,slug,excerpt,status,github_path,github_sha,published_at,author_id,category_id,sync_job_id')
    .eq('id', id).maybeSingle();
  if (!article) return NextResponse.json({ error: '文章不存在' }, { status: 404 });
  const { data: revision } = await auth.supabase.from('article_revisions')
    .select('id,title,excerpt,github_path,github_sha,content_hash')
    .eq('id', revisionId).eq('article_id', id).maybeSingle();
  if (!revision?.github_path || !revision.github_sha) {
    return NextResponse.json({ error: '该历史版本没有可恢复的 GitHub 文件引用' }, { status: 422 });
  }
  let historical;
  try { historical = await readMarkdownFileFresh(revision.github_path, revision.github_sha); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : '读取历史版本失败' }, { status: 502 }); }
  if (!historical) return NextResponse.json({ error: 'GitHub 中找不到该历史版本文件' }, { status: 404 });

  const path = articleMarkdownPath(article.slug);
  const contentHash = hashMarkdown(historical.content);
  const service = createServiceClient();
  let job;
  let lease;
  try {
    const current = await readMarkdownFileFresh(path);
    job = await createArticleSyncJob(service, {
      idempotencyKey: `admin:restore:${id}:${revisionId}:${current?.sha || 'empty'}:${contentHash}`,
      operation: 'restore', articleId: id, actorId: auth.user.id, targetPath: path, contentHash,
      metadata: { title: article.title, slug: article.slug, excerpt: revision.excerpt,
        status: article.status, editor_id: auth.user.id,
        published_at: article.published_at, author_id: article.author_id, category_id: article.category_id,
        base_article_sync_job_id: article.sync_job_id, restored_revision_id: revisionId,
        base_github_sha: current?.sha || null },
    });
    if (job.state === 'completed') return NextResponse.json({ success: true, sync_job_id: job.id, duplicate: true });
    lease = await claimArticleSyncJob(service, job.id);
    if (!lease) return NextResponse.json({ error: '该同步任务正在处理中，请稍后重试', sync_job_id: job.id }, { status: 409 });
    const metadata = job.metadata && typeof job.metadata === 'object' && !Array.isArray(job.metadata)
      ? job.metadata as Record<string, unknown> : {};
    let commitSha = job.github_sha;
    const latest = await readMarkdownFileFresh(path);
    const baseSha = typeof metadata.base_github_sha === 'string' ? metadata.base_github_sha : null;
    if (job.state === 'github_written') {
      if (!latest || hashMarkdown(latest.content) !== contentHash) {
        await updateArticleSyncJob(service, job.id, lease.leaseToken, 'conflict', { error: '恢复任务标记为 GitHub 已写入，但当前文件哈希不匹配' });
        return NextResponse.json({ error: 'GitHub 正文与恢复任务不一致，已停止自动覆盖', sync_job_id: job.id }, { status: 409 });
      }
      commitSha = job.github_sha || await readLatestMarkdownCommitSha(path, latest.sha) || '';
      if (!commitSha) throw new Error('GitHub 正文存在，但无法确认对应提交 SHA；请稍后重试');
      if (!job.github_sha) await updateArticleSyncJob(service, job.id, lease.leaseToken, 'github_written', { githubSha: commitSha });
    } else if (latest && hashMarkdown(latest.content) === contentHash) {
      // The GitHub PUT may have succeeded before the task status update failed.
      commitSha = await readLatestMarkdownCommitSha(path, latest.sha) || '';
      if (!commitSha) throw new Error('GitHub 正文存在，但无法确认对应提交 SHA；请稍后重试');
      await updateArticleSyncJob(service, job.id, lease.leaseToken, 'github_written', { githubSha: commitSha });
    } else {
      if ((latest?.sha || null) !== baseSha) {
        await updateArticleSyncJob(service, job.id, lease.leaseToken, 'conflict', { error: '恢复期间文章文件已被其他操作修改' });
        return NextResponse.json({ error: '恢复期间文章已更新，请重新加载后操作', sync_job_id: job.id }, { status: 409 });
      }
      const saved = await writeMarkdownFile(path, historical.content, `Restore article revision: ${article.title}`, { expectedBlobSha: baseSha });
      commitSha = saved.commitSha;
      await updateArticleSyncJob(service, job.id, lease.leaseToken, 'github_written', { githubSha: commitSha });
    }

    const { error } = await service.from('articles').update({
      github_path: path, github_sha: commitSha, content_hash: contentHash,
      updated_at: new Date().toISOString(), sync_job_id: job.id,
    }).eq('id', id);
    if (error) throw new Error(`GitHub 已恢复正文，但元数据同步失败：${error.message}`);
    const revisionValues = {
      article_id: id, editor_id: auth.user.id, title: article.title, excerpt: revision.excerpt,
      content_markdown: '', github_path: path, github_sha: commitSha, content_hash: contentHash, sync_job_id: job.id,
    };
    const { data: existingRevision, error: revisionLookupError } = await service.from('article_revisions')
      .select('id').eq('sync_job_id', job.id).maybeSingle();
    if (revisionLookupError) throw new Error(revisionLookupError.message);
    const { error: revisionError } = existingRevision
      ? await service.from('article_revisions').update(revisionValues).eq('id', existingRevision.id)
      : await service.from('article_revisions').insert(revisionValues);
    if (revisionError) throw new Error(`文章已恢复，但版本索引失败：${revisionError.message}`);
    const { data: existingAudit } = await service.from('audit_logs').select('id')
      .eq('entity_type', 'article').eq('entity_id', id)
      .contains('details', { sync_job_id: job.id }).maybeSingle();
    if (!existingAudit) {
      await service.from('audit_logs').insert({
        actor_id: auth.user.id, action: 'article.revision.restore', entity_type: 'article', entity_id: id,
        details: { sync_job_id: job.id, restored_revision_id: revisionId, github_path: path, github_sha: commitSha },
      });
    }
    await updateArticleSyncJob(service, job.id, lease.leaseToken, 'completed', { articleId: id, githubSha: commitSha });
    revalidateTag('github-articles', { expire: 0 });
    return NextResponse.json({ success: true, github_path: path, github_sha: commitSha, sync_job_id: job.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : '恢复同步失败';
    if (job && lease) { try { await updateArticleSyncJob(service, job.id, lease.leaseToken, 'failed', { error: message }); } catch {} }
    return NextResponse.json({ error: message, sync_pending: Boolean(job), sync_job_id: job?.id }, { status: 502 });
  }
}
