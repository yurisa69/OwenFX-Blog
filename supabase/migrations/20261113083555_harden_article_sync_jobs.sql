-- Reconstructed archival record for production migration 20261113083555.
-- The original direct-application SQL was not present in GitHub.
-- Do not replay against the existing production database.

alter table private.article_sync_jobs add column if not exists lease_token uuid;
alter table private.article_sync_jobs add column if not exists lease_expires_at timestamptz;

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
  if v_job.operation <> p_operation or v_job.target_path <> p_target_path
     or v_job.content_hash <> p_content_hash or v_job.article_id is distinct from p_article_id then
    raise exception 'Idempotency key already exists with different article sync payload' using errcode='23505';
  end if;
  return to_jsonb(v_job);
end;
$function$;

create or replace function public.claim_article_sync_job(p_id uuid,p_lease_token uuid,p_lease_seconds integer default 120)
returns jsonb language plpgsql security definer set search_path=pg_catalog,private
as $function$
declare v_job private.article_sync_jobs;
begin
  if p_lease_seconds < 15 or p_lease_seconds > 600 then raise exception 'Lease duration must be between 15 and 600 seconds'; end if;
  update private.article_sync_jobs
  set lease_token=p_lease_token,lease_expires_at=now()+make_interval(secs=>p_lease_seconds),
      attempt_count=attempt_count+1,updated_at=now()
  where id=p_id and state in ('pending','github_written','failed')
    and (lease_expires_at is null or lease_expires_at < now())
  returning * into v_job;
  return case when v_job.id is null then null else to_jsonb(v_job) end;
end;
$function$;

drop function if exists public.update_article_sync_job(uuid,text,text,text,uuid);

create or replace function public.update_article_sync_job(
  p_id uuid,p_state text,p_github_sha text,p_last_error text,p_article_id uuid,p_lease_token uuid
) returns boolean language plpgsql security definer set search_path=pg_catalog,private
as $function$
declare v_current text;
begin
  if p_state not in ('pending','github_written','completed','conflict','failed') then return false; end if;
  select state into v_current from private.article_sync_jobs
  where id=p_id and lease_token=p_lease_token and lease_expires_at > now() for update;
  if not found then return false; end if;
  if not ((v_current='pending' and p_state in ('github_written','failed','conflict'))
       or (v_current='github_written' and p_state in ('completed','failed','conflict'))
       or (v_current='failed' and p_state in ('github_written','failed','conflict'))) then return false; end if;
  update private.article_sync_jobs set state=p_state,github_sha=coalesce(p_github_sha,github_sha),
    last_error=p_last_error,article_id=coalesce(p_article_id,article_id),updated_at=now(),
    completed_at=case when p_state='completed' then now() else completed_at end,
    lease_token=case when p_state in ('completed','conflict') then null else lease_token end,
    lease_expires_at=case when p_state in ('completed','conflict') then null else lease_expires_at end
  where id=p_id;
  return true;
end;
$function$;

revoke all on function public.claim_article_sync_job(uuid,uuid,integer) from public,anon,authenticated;
revoke all on function public.update_article_sync_job(uuid,text,text,text,uuid,uuid) from public,anon,authenticated;
grant execute on function public.claim_article_sync_job(uuid,uuid,integer) to service_role;
grant execute on function public.update_article_sync_job(uuid,text,text,text,uuid,uuid) to service_role;
