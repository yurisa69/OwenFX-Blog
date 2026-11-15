alter table public.software
  add column if not exists archive_previous_status text,
  add column if not exists trash_previous_status text,
  add column if not exists deleted_at timestamptz;

alter table public.software drop constraint if exists software_status_check;
alter table public.software add constraint software_status_check
  check (status = any (array['draft'::text, 'published'::text, 'archived'::text, 'trashed'::text]));

create index if not exists software_status_updated_at_idx
  on public.software (status, updated_at desc);
