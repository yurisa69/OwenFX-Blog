drop policy if exists "content editors manage api devices" on public.api_devices;

create policy "content editors manage own api devices"
  on public.api_devices
  for all
  to authenticated
  using (user_id = (select auth.uid()) and public.is_owenfx_content_editor())
  with check (user_id = (select auth.uid()) and public.is_owenfx_content_editor());
