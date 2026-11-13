create or replace function public.update_article_sync_job(
 p_id uuid,p_state text,p_github_sha text,p_last_error text,p_article_id uuid,p_lease_token uuid
) returns boolean language plpgsql security definer set search_path=pg_catalog,private
as $function$
declare v_current text;
begin
 if p_state not in ('pending','github_written','completed','conflict','failed') then return false; end if;
 select state into v_current from private.article_sync_jobs
 where id=p_id and lease_token=p_lease_token and lease_expires_at>now() for update;
 if not found then return false; end if;
 if not ((v_current='pending' and p_state in ('github_written','failed','conflict'))
   or (v_current='github_written' and p_state in ('completed','failed','conflict'))
   or (v_current='failed' and p_state in ('github_written','failed','conflict'))) then return false; end if;
 update private.article_sync_jobs set state=p_state,github_sha=coalesce(p_github_sha,github_sha),
  last_error=p_last_error,article_id=coalesce(p_article_id,article_id),updated_at=now(),
  completed_at=case when p_state='completed' then now() else completed_at end,
  lease_token=case when p_state in ('completed','conflict','failed') then null else lease_token end,
  lease_expires_at=case when p_state in ('completed','conflict','failed') then null else lease_expires_at end
 where id=p_id;
 return true;
end;
$function$;
revoke all on function public.update_article_sync_job(uuid,text,text,text,uuid,uuid) from public,anon,authenticated;
grant execute on function public.update_article_sync_job(uuid,text,text,text,uuid,uuid) to service_role;