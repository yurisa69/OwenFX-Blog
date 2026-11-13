-- Atomic API rate limiting and server-only analytics writes.
-- Applied to production as migration 20261113054024.

CREATE TABLE private.api_rate_limits (
  bucket_key text PRIMARY KEY CHECK (bucket_key ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE private.api_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.api_rate_limits FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE private.api_rate_limits TO service_role;

CREATE POLICY "Service role manages API rate limits"
  ON private.api_rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.consume_api_rate_limit(
  p_bucket_key text,
  p_limit integer DEFAULT 60,
  p_window_seconds integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = pg_catalog, private
AS $function$
DECLARE
  v_count integer;
  v_window_seconds integer := greatest(1, least(coalesce(p_window_seconds, 60), 86400));
  v_limit integer := greatest(1, least(coalesce(p_limit, 60), 1000));
BEGIN
  IF p_bucket_key IS NULL OR p_bucket_key !~ '^[0-9a-f]{64}$' THEN
    RETURN false;
  END IF;

  INSERT INTO private.api_rate_limits (bucket_key, window_started_at, request_count, updated_at)
  VALUES (p_bucket_key, now(), 1, now())
  ON CONFLICT (bucket_key) DO UPDATE
  SET
    window_started_at = CASE
      WHEN private.api_rate_limits.window_started_at <= now() - make_interval(secs => v_window_seconds)
      THEN now()
      ELSE private.api_rate_limits.window_started_at
    END,
    request_count = CASE
      WHEN private.api_rate_limits.window_started_at <= now() - make_interval(secs => v_window_seconds)
      THEN 1
      ELSE private.api_rate_limits.request_count + 1
    END,
    updated_at = now()
  RETURNING request_count INTO v_count;

  RETURN v_count <= v_limit;
END;
$function$;

REVOKE ALL ON FUNCTION public.consume_api_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_api_rate_limit(text, integer, integer) TO service_role;

DROP POLICY IF EXISTS "Public insert analytics events" ON public.analytics_events;
REVOKE INSERT ON TABLE public.analytics_events FROM anon, authenticated;
GRANT INSERT ON TABLE public.analytics_events TO service_role;
