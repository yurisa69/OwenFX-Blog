-- Reconstructed archival record for production migration 20261113082045.
-- The original direct-application SQL was not present in GitHub.
-- Do not replay against the existing production database.

alter table public.articles add column if not exists sync_job_id uuid;
create unique index if not exists articles_sync_job_id_uidx on public.articles(sync_job_id) where sync_job_id is not null;
alter table public.article_revisions add column if not exists sync_job_id uuid;
create unique index if not exists article_revisions_sync_job_id_uidx on public.article_revisions(sync_job_id) where sync_job_id is not null;

create schema if not exists private;
create table if not exists private.article_sync_jobs (
  id uuid primary key,
  idempotency_key text not null unique,
  operation text not null check (operation in ('create','update','restore','import')),
  article_id uuid,
  actor_id uuid,
  target_path text not null,
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  github_sha text,
  metadata jsonb not null default '{}'::jsonb,
  state text not null default 'pending' check (state in ('pending','github_written','completed','conflict','failed')),
  last_error text,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists article_sync_jobs_state_updated_idx on private.article_sync_jobs(state,updated_at);
alter table private.article_sync_jobs enable row level security;
revoke all on table private.article_sync_jobs from public,anon,authenticated;
grant all on table private.article_sync_jobs to service_role;
create policy "Service role manages article sync jobs" on private.article_sync_jobs for all to service_role using (true) with check (true);

create or replace function public.create_article_sync_job(
  p_id uuid,p_idempotency_key text,p_operation text,p_article_id uuid,p_actor_id uuid,
  p_target_path text,p_content_hash text,p_metadata jsonb
) returns jsonb language plpgsql security definer set search_path=pg_catalog,private
as $function$
declare v_job private.article_sync_jobs;
begin
  insert into private.article_sync_jobs(id,idempotency_key,operation,article_id,actor_id,target_path,content_hash,metadata)
  values(p_id,p_idempotency_key,p_operation,p_article_id,p_actor_id,p_target_path,p_content_hash,coalesce(p_metadata,'{}'::jsonb))
  on conflict(idempotency_key) do nothing;
  select * into v_job from private.article_sync_jobs where idempotency_key=p_idempotency_key for update;
  return to_jsonb(v_job);
end;
$function$;

create or replace function public.get_article_sync_job(p_id uuid)
returns jsonb language sql set search_path=pg_catalog,private
as $function$ select to_jsonb(j) from private.article_sync_jobs j where j.id=p_id; $function$;

create or replace function public.update_article_sync_job(
  p_id uuid,p_state text,p_github_sha text,p_last_error text,p_article_id uuid
) returns boolean language plpgsql security definer set search_path=pg_catalog,private
as $function$
begin
  if p_state not in ('pending','github_written','completed','conflict','failed') then return false; end if;
  update private.article_sync_jobs
  set state=p_state,github_sha=coalesce(p_github_sha,github_sha),last_error=p_last_error,
      article_id=coalesce(p_article_id,article_id),attempt_count=attempt_count+1,
      updated_at=now(),completed_at=case when p_state='completed' then now() else completed_at end
  where id=p_id;
  return found;
end;
$function$;

revoke all on function public.create_article_sync_job(uuid,text,text,uuid,uuid,text,text,jsonb) from public,anon,authenticated;
revoke all on function public.get_article_sync_job(uuid) from public,anon,authenticated;
revoke all on function public.update_article_sync_job(uuid,text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.create_article_sync_job(uuid,text,text,uuid,uuid,text,text,jsonb) to service_role;
grant execute on function public.get_article_sync_job(uuid) to service_role;
grant execute on function public.update_article_sync_job(uuid,text,text,text,uuid) to service_role;
