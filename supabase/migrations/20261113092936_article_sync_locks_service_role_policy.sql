create policy "Service role manages article sync locks"
on private.article_sync_locks
for all
to service_role
using (true)
with check (true);