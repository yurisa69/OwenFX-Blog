alter table public.articles
  add column if not exists github_path text,
  add column if not exists github_sha text,
  add column if not exists content_hash text;

alter table public.article_revisions
  add column if not exists github_path text,
  add column if not exists github_sha text,
  add column if not exists content_hash text;

create table if not exists public.api_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  token_hash text not null unique,
  scopes text[] not null default array['articles:import']::text[],
  active boolean not null default true,
  expires_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists api_devices_user_created_idx
  on public.api_devices (user_id, created_at desc);

alter table public.api_devices enable row level security;

drop policy if exists "content editors manage api devices" on public.api_devices;
create policy "content editors manage api devices"
  on public.api_devices
  for all
  to authenticated
  using (public.is_owenfx_content_editor())
  with check (public.is_owenfx_content_editor());
