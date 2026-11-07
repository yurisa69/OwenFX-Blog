-- OwenFX unified Cloudflare R2 media registry.
-- Binary media stays in R2; Supabase stores metadata and ownership only.

alter table public.media_assets
  add column if not exists media_kind text not null default 'image'
    check (media_kind in ('image','avatar','background','software_icon','video','comment_image','attachment')),
  add column if not exists original_filename text,
  add column if not exists entity_type text,
  add column if not exists entity_id uuid,
  add column if not exists upload_status text not null default 'ready'
    check (upload_status in ('pending','ready','failed','deleted')),
  add column if not exists width integer,
  add column if not exists height integer,
  add column if not exists duration_seconds numeric(10,2),
  add column if not exists etag text;

create index if not exists media_assets_owner_kind_created_idx
  on public.media_assets(owner_id, media_kind, created_at desc);

create index if not exists media_assets_entity_idx
  on public.media_assets(entity_type, entity_id)
  where entity_id is not null;

drop policy if exists "Owners update own media assets" on public.media_assets;
create policy "Owners update own media assets"
  on public.media_assets for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "Owners delete own media assets" on public.media_assets;
create policy "Owners delete own media assets"
  on public.media_assets for delete to authenticated
  using (owner_id = (select auth.uid()));
