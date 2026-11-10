-- Recreate the public analytics insert policy without the retired resource_click event.
-- Applied to production as migration 20261110090913.

drop policy if exists "Public insert analytics events" on public.analytics_events;

create policy "Public insert analytics events"
  on public.analytics_events
  for insert
  to anon, authenticated
  with check (
    event_type = any (array[
      'software_click'::text,
      'wechat_click'::text,
      'ad_click'::text,
      'article_view'::text
    ])
  );
