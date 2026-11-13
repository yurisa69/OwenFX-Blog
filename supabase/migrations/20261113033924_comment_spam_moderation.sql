ALTER TABLE public.comments
  DROP CONSTRAINT IF EXISTS comments_status_check;

ALTER TABLE public.comments
  ADD CONSTRAINT comments_status_check
  CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'spam'::text, 'deleted'::text]));

ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS moderation_source text
    CHECK (moderation_source IS NULL OR moderation_source = ANY (ARRAY['akismet'::text, 'local_rule'::text, 'admin'::text])),
  ADD COLUMN IF NOT EXISTS moderation_reason text,
  ADD COLUMN IF NOT EXISTS moderation_previous_status text
    CHECK (moderation_previous_status IS NULL OR moderation_previous_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'spam'::text])),
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.comment_moderation_context (
  comment_id uuid PRIMARY KEY REFERENCES public.comments(id) ON DELETE CASCADE,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.comment_moderation_context ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.comment_moderation_context FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.comment_moderation_context TO service_role;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

CREATE TABLE IF NOT EXISTS private.comment_rate_limits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE private.comment_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.comment_rate_limits FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE private.comment_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.consume_comment_rate_limit(
  p_user_id uuid,
  p_limit integer DEFAULT 5,
  p_window_seconds integer DEFAULT 600
)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = pg_catalog, private
AS $function$
DECLARE
  v_count integer;
  v_window_seconds integer := greatest(60, least(coalesce(p_window_seconds, 600), 86400));
  v_limit integer := greatest(1, least(coalesce(p_limit, 5), 100));
BEGIN
  INSERT INTO private.comment_rate_limits (user_id, window_started_at, request_count, updated_at)
  VALUES (p_user_id, now(), 1, now())
  ON CONFLICT (user_id) DO UPDATE
  SET
    window_started_at = CASE
      WHEN private.comment_rate_limits.window_started_at <= now() - make_interval(secs => v_window_seconds)
      THEN now()
      ELSE private.comment_rate_limits.window_started_at
    END,
    request_count = CASE
      WHEN private.comment_rate_limits.window_started_at <= now() - make_interval(secs => v_window_seconds)
      THEN 1
      ELSE private.comment_rate_limits.request_count + 1
    END,
    updated_at = now()
  RETURNING request_count INTO v_count;

  RETURN v_count <= v_limit;
END;
$function$;

REVOKE ALL ON FUNCTION public.consume_comment_rate_limit(uuid, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_comment_rate_limit(uuid, integer, integer) TO service_role;
