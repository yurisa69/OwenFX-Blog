create or replace function public.list_article_sync_jobs(
  p_limit integer default 50,
  p_state text default null
) returns jsonb
language sql
security definer
set search_path = pg_catalog, private
as $function$
  select coalesce(jsonb_agg(to_jsonb(j) order by j.updated_at desc), '[]'::jsonb)
  from (
    select
      id,
      operation,
      article_id,
      target_path,
      state,
      left(last_error, 1000) as last_error,
      attempt_count,
      created_at,
      updated_at,
      lease_expires_at,
      nullif(metadata->>'title', '') as article_title,
      (
        state in ('pending', 'github_written', 'failed')
        and (lease_expires_at is null or lease_expires_at <= now())
      ) as retryable
    from private.article_sync_jobs
    where p_state is null or state = p_state
    order by updated_at desc
    limit least(greatest(coalesce(p_limit, 50), 1), 100)
  ) as j;
$function$;

revoke all on function public.list_article_sync_jobs(integer, text) from public, anon, authenticated;
grant execute on function public.list_article_sync_jobs(integer, text) to service_role;

comment on function public.list_article_sync_jobs(integer, text)
is 'Returns a bounded, redacted list of article sync jobs for authenticated server-side content administration.';
