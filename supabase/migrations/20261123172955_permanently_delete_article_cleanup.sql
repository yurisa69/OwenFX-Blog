create or replace function public.permanently_delete_article(
  p_article_id uuid,
  p_job_id uuid,
  p_lease_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  v_status text;
  v_article_count integer := 0;
  v_revision_count integer := 0;
  v_comment_count integer := 0;
  v_notification_count integer := 0;
  v_comment_like_count integer := 0;
  v_comment_context_count integer := 0;
  v_interaction_count integer := 0;
  v_tag_count integer := 0;
  v_analytics_count integer := 0;
  v_media_count integer := 0;
  v_media_audit_count integer := 0;
  v_article_audit_count integer := 0;
  v_job_count integer := 0;
  v_lock_count integer := 0;
begin
  select a.status into v_status
  from public.articles a
  where a.id = p_article_id
  for update;

  if not found then
    raise exception 'Article not found' using errcode = 'P0002';
  end if;
  if v_status <> 'trashed' then
    raise exception 'Only trashed articles can be permanently deleted' using errcode = '55000';
  end if;
  if not exists (
    select 1 from private.article_sync_locks l
    where l.article_id = p_article_id and l.job_id = p_job_id
      and l.lease_token = p_lease_token and l.lease_expires_at > clock_timestamp()
  ) then
    raise exception 'Article deletion lock is missing or expired' using errcode = '55P03';
  end if;
  if exists (
    select 1 from private.article_sync_jobs j
    where j.article_id = p_article_id
      and j.state in ('pending', 'github_written', 'failed')
      and j.lease_expires_at > clock_timestamp()
  ) then
    raise exception 'An article sync job still has an active lease' using errcode = '55P03';
  end if;

  select count(*) into v_revision_count from public.article_revisions r where r.article_id = p_article_id;
  select count(*) into v_comment_count from public.comments c where c.article_id = p_article_id;
  select count(*) into v_notification_count
    from public.notifications n
    where n.article_id = p_article_id
       or n.comment_id in (select c.id from public.comments c where c.article_id = p_article_id);
  select count(*) into v_comment_like_count
    from public.comment_likes cl
    where cl.comment_id in (select c.id from public.comments c where c.article_id = p_article_id);
  select count(*) into v_comment_context_count
    from public.comment_moderation_context cmc
    where cmc.comment_id in (select c.id from public.comments c where c.article_id = p_article_id);
  select count(*) into v_interaction_count from public.article_interactions ai where ai.article_id = p_article_id;
  select count(*) into v_tag_count from public.article_tags at where at.article_id = p_article_id;

  delete from public.analytics_events
  where article_id = p_article_id or target_key = '/articles/' || p_article_id::text;
  get diagnostics v_analytics_count = row_count;

  delete from public.audit_logs al
  where al.entity_type = 'media_asset'
    and al.entity_id in (
      select ma.id::text from public.media_assets ma
      where ma.entity_type = 'article' and ma.entity_id = p_article_id::text
    );
  get diagnostics v_media_audit_count = row_count;

  delete from public.media_assets ma
  where ma.entity_type = 'article' and ma.entity_id = p_article_id::text;
  get diagnostics v_media_count = row_count;

  delete from private.article_sync_jobs j where j.article_id = p_article_id;
  get diagnostics v_job_count = row_count;

  delete from public.audit_logs al
  where al.entity_type = 'article' and al.entity_id = p_article_id::text;
  get diagnostics v_article_audit_count = row_count;

  delete from private.article_sync_locks l
  where l.article_id = p_article_id and l.job_id = p_job_id and l.lease_token = p_lease_token;
  get diagnostics v_lock_count = row_count;

  delete from public.articles a where a.id = p_article_id and a.status = 'trashed';
  get diagnostics v_article_count = row_count;
  if v_article_count <> 1 then
    raise exception 'Article row was not deleted; transaction rolled back';
  end if;

  return jsonb_build_object(
    'success', true,
    'deleted_article', v_article_count,
    'deleted_revisions', v_revision_count,
    'deleted_comments', v_comment_count,
    'deleted_notifications', v_notification_count,
    'deleted_comment_likes', v_comment_like_count,
    'deleted_comment_moderation_context', v_comment_context_count,
    'deleted_interactions', v_interaction_count,
    'deleted_tags', v_tag_count,
    'deleted_analytics_events', v_analytics_count,
    'deleted_media_assets', v_media_count,
    'deleted_media_audit_logs', v_media_audit_count,
    'deleted_article_audit_logs', v_article_audit_count,
    'deleted_sync_jobs', v_job_count,
    'released_deletion_lock', v_lock_count
  );
end;
$function$;

revoke all on function public.permanently_delete_article(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.permanently_delete_article(uuid, uuid, uuid) to service_role;

comment on function public.permanently_delete_article(uuid, uuid, uuid)
is 'Atomically deletes a trashed article and its application data/history after the server removes its GitHub file and exclusively owned R2 media objects.';
