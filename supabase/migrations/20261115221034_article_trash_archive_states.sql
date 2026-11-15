ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS archive_previous_status TEXT,
  ADD COLUMN IF NOT EXISTS trash_previous_status TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.articles
  DROP CONSTRAINT IF EXISTS articles_status_check;

ALTER TABLE public.articles
  ADD CONSTRAINT articles_status_check
  CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text, 'trashed'::text]));

ALTER TABLE public.articles
  ADD CONSTRAINT articles_archive_previous_status_check
  CHECK (archive_previous_status IS NULL OR archive_previous_status IN ('draft', 'published'));

ALTER TABLE public.articles
  ADD CONSTRAINT articles_trash_previous_status_check
  CHECK (trash_previous_status IS NULL OR trash_previous_status IN ('draft', 'published', 'archived'));

CREATE INDEX IF NOT EXISTS articles_trashed_updated_at_idx
  ON public.articles (updated_at DESC)
  WHERE status = 'trashed';
