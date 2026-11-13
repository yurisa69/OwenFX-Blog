import { randomUUID } from 'node:crypto';
import type { Json } from '@/types/database';

type SyncOperation = 'create' | 'update' | 'restore' | 'import';
export type ArticleSyncJob = {
  id: string;
  idempotency_key: string;
  operation: SyncOperation;
  article_id: string | null;
  actor_id: string | null;
  target_path: string;
  content_hash: string;
  github_sha: string | null;
  metadata: Record<string, unknown>;
  state: 'pending' | 'github_written' | 'completed' | 'conflict' | 'failed';
  lease_token: string | null;
};

type ServiceClient = ReturnType<typeof import('@/lib/supabase/service').createServiceClient>;

export async function createArticleSyncJob(
  service: ServiceClient,
  input: {
    idempotencyKey: string;
    operation: SyncOperation;
    articleId?: string | null;
    actorId?: string | null;
    targetPath: string;
    contentHash: string;
    metadata: Record<string, unknown>;
  },
) {
  const id = randomUUID();
  const { data, error } = await service.rpc('create_article_sync_job', {
    p_id: id,
    p_idempotency_key: input.idempotencyKey,
    p_operation: input.operation,
    p_article_id: input.articleId ?? null,
    p_actor_id: input.actorId ?? null,
    p_target_path: input.targetPath,
    p_content_hash: input.contentHash,
    p_metadata: input.metadata as Json,
  });
  if (error) throw new Error(`创建文章同步任务失败：${error.message}`);
  const job = data as unknown as ArticleSyncJob;
  if (!job?.id) throw new Error('同步任务 RPC 未返回有效任务');
  return job;
}

export async function claimArticleSyncJob(service: ServiceClient, id: string) {
  const leaseToken = randomUUID();
  const { data, error } = await service.rpc('claim_article_sync_job', {
    p_id: id, p_lease_token: leaseToken, p_lease_seconds: 120,
  });
  if (error) throw new Error(`领取文章同步任务失败：${error.message}`);
  const job = data as unknown as ArticleSyncJob | null;
  if (!job?.id) return null;
  return { job, leaseToken };
}

export async function updateArticleSyncJob(
  service: ServiceClient,
  id: string,
  leaseToken: string,
  state: ArticleSyncJob['state'],
  options: { githubSha?: string | null; error?: string | null; articleId?: string | null } = {},
) {
  const { data, error } = await service.rpc('update_article_sync_job', {
    p_id: id,
    p_state: state,
    p_github_sha: options.githubSha ?? null,
    p_last_error: options.error ?? null,
    p_article_id: options.articleId ?? null,
    p_lease_token: leaseToken,
  });
  if (error) throw new Error(`更新文章同步任务失败：${error.message}`);
  if (data !== true) throw new Error('同步任务租约已失效或状态转换不允许');
}


export async function acquireArticleSyncLock(
  service: ServiceClient,
  articleId: string,
  jobId: string,
  leaseToken: string,
) {
  const { data, error } = await service.rpc('acquire_article_sync_lock', {
    p_article_id: articleId,
    p_job_id: jobId,
    p_lease_token: leaseToken,
    p_lease_seconds: 300,
  });
  if (error) throw new Error(`获取文章同步锁失败：${error.message}`);
  return data === true;
}

export async function releaseArticleSyncLock(
  service: ServiceClient,
  articleId: string,
  jobId: string,
  leaseToken: string,
) {
  const { data, error } = await service.rpc('release_article_sync_lock', {
    p_article_id: articleId,
    p_job_id: jobId,
    p_lease_token: leaseToken,
  });
  if (error) throw new Error(`释放文章同步锁失败：${error.message}`);
  return data === true;
}
