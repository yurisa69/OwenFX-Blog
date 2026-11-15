import type { createServiceClient } from '@/lib/supabase/service';

type ServiceClient = ReturnType<typeof createServiceClient>;

export type ArticleRevisionValues = {
  article_id: string;
  editor_id: string;
  title: string;
  excerpt: string;
  content_markdown: string;
  github_path: string;
  github_sha: string;
  content_hash: string;
  sync_job_id: string;
};

export type ArticleAuditValues = {
  actor_id: string;
  action: string;
  entity_type: 'article';
  entity_id: string;
  details: {
    sync_job_id: string;
    storage: 'github';
    github_path: string;
    github_sha: string;
  };
};

export async function upsertArticleRevision(service: ServiceClient, values: ArticleRevisionValues) {
  const { data: existingRevision, error: lookupError } = await service.from('article_revisions')
    .select('id').eq('sync_job_id', values.sync_job_id).maybeSingle();
  if (lookupError) throw new Error(lookupError.message);

  const { error } = existingRevision
    ? await service.from('article_revisions').update(values).eq('id', existingRevision.id)
    : await service.from('article_revisions').insert(values);
  if (error) throw new Error(`文章已保存，但版本索引写入失败：${error.message}`);
}

export async function ensureArticleAuditLog(service: ServiceClient, values: ArticleAuditValues) {
  const { data: existingAudit } = await service.from('audit_logs').select('id')
    .eq('entity_type', 'article').eq('entity_id', values.entity_id)
    .contains('details', { sync_job_id: values.details.sync_job_id }).maybeSingle();
  if (!existingAudit) {
    await service.from('audit_logs').insert(values);
  }
}
