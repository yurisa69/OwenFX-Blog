-- Add article-scoped leases so separate sync jobs cannot write one article concurrently.
create table if not exists private.article_sync_locks (
  article_id uuid primary key,
  job_id uuid not null,
  lease_token uuid not null,
  lease_expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);
alter table private.article_sync_locks enable row level security;
revoke all on table private.article_sync_locks from public, anon, authenticated;
grant all on table private.article_sync_locks to service_role;

create or replace function public.acquire_article_sync_lock(
  p_article_id uuid,p_job_id uuid,p_lease_token uuid,p_lease_seconds integer default 300
) returns boolean language plpgsql security definer set search_path=pg_catalog,private
as $function$
begin
  if p_lease_seconds < 30 or p_lease_seconds > 600 then
    raise exception 'Article lock duration must be between 30 and 600 seconds';
  end if;
  insert into private.article_sync_locks(article_id,job_id,lease_token,lease_expires_at)
  values(p_article_id,p_job_id,p_lease_token,now()+make_interval(secs=>p_lease_seconds))
  on conflict(article_id) do update set job_id=excluded.job_id,lease_token=excluded.lease_token,
    lease_expires_at=excluded.lease_expires_at,updated_at=now()
  where private.article_sync_locks.lease_expires_at <= now()
     or (private.article_sync_locks.job_id=excluded.job_id and private.article_sync_locks.lease_token=excluded.lease_token);
  return found;
end;
$function$;

create or replace function public.release_article_sync_lock(p_article_id uuid,p_job_id uuid,p_lease_token uuid)
returns boolean language plpgsql security definer set search_path=pg_catalog,private
as $function$
begin
  delete from private.article_sync_locks where article_id=p_article_id and job_id=p_job_id and lease_token=p_lease_token;
  return found;
end;
$function$;
revoke all on function public.acquire_article_sync_lock(uuid,uuid,uuid,integer) from public,anon,authenticated;
revoke all on function public.release_article_sync_lock(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.acquire_article_sync_lock(uuid,uuid,uuid,integer) to service_role;
grant execute on function public.release_article_sync_lock(uuid,uuid,uuid) to service_role;