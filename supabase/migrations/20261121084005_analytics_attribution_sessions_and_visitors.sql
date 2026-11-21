-- Extend first-party analytics with first-touch, last-external and session attribution.
-- Existing analytics events are retained; all new fields are nullable for backwards compatibility.

ALTER TABLE public.analytics_events
  ADD COLUMN session_id uuid,
  ADD COLUMN first_source_type text,
  ADD COLUMN first_source_name text,
  ADD COLUMN first_referrer_host text,
  ADD COLUMN last_external_source_type text,
  ADD COLUMN last_external_source_name text,
  ADD COLUMN last_external_referrer_host text,
  ADD COLUMN session_source_type text,
  ADD COLUMN session_source_name text,
  ADD COLUMN session_referrer_host text,
  ADD COLUMN utm_medium text,
  ADD COLUMN utm_campaign text;

ALTER TABLE public.analytics_events
  ADD CONSTRAINT analytics_events_attribution_source_type_check
  CHECK (
    (first_source_type IS NULL OR first_source_type IN ('direct','search','referral','internal','campaign'))
    AND (last_external_source_type IS NULL OR last_external_source_type IN ('direct','search','referral','internal','campaign'))
    AND (session_source_type IS NULL OR session_source_type IN ('direct','search','referral','internal','campaign'))
  ),
  ADD CONSTRAINT analytics_events_attribution_label_length_check
  CHECK (
    (first_source_name IS NULL OR char_length(first_source_name) <= 80)
    AND (last_external_source_name IS NULL OR char_length(last_external_source_name) <= 80)
    AND (session_source_name IS NULL OR char_length(session_source_name) <= 80)
    AND (utm_medium IS NULL OR char_length(utm_medium) <= 80)
    AND (utm_campaign IS NULL OR char_length(utm_campaign) <= 80)
  ),
  ADD CONSTRAINT analytics_events_attribution_host_length_check
  CHECK (
    (first_referrer_host IS NULL OR char_length(first_referrer_host) <= 180)
    AND (last_external_referrer_host IS NULL OR char_length(last_external_referrer_host) <= 180)
    AND (session_referrer_host IS NULL OR char_length(session_referrer_host) <= 180)
  );

CREATE INDEX analytics_events_created_session_idx
  ON public.analytics_events (created_at, session_id)
  WHERE session_id IS NOT NULL AND event_type IN ('page_view','article_view','software_view');

CREATE INDEX analytics_events_created_first_source_idx
  ON public.analytics_events (created_at, first_source_type, first_referrer_host)
  WHERE first_source_type IS NOT NULL AND event_type IN ('page_view','article_view','software_view');

CREATE INDEX analytics_events_created_last_external_idx
  ON public.analytics_events (created_at, last_external_referrer_host)
  WHERE last_external_referrer_host IS NOT NULL AND event_type IN ('page_view','article_view','software_view');

CREATE OR REPLACE FUNCTION public.get_admin_analytics(
  p_since timestamptz DEFAULT now() - interval '30 days'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_since timestamptz := COALESCE(p_since, now() - interval '30 days');
  v_result jsonb;
BEGIN
  IF NOT public.is_owenfx_admin() THEN
    RAISE EXCEPTION 'Not authorized to read analytics' USING ERRCODE = '42501';
  END IF;

  WITH period_events AS (
    SELECT *
    FROM public.analytics_events
    WHERE created_at >= v_since
      AND event_type IN ('page_view','article_view','software_view')
  ),
  period_visitors AS (
    SELECT DISTINCT visitor_id
    FROM period_events
    WHERE visitor_id IS NOT NULL
  ),
  first_seen AS (
    SELECT visitor_id, min(created_at) AS first_seen_at
    FROM public.analytics_events
    WHERE event_type IN ('page_view','article_view','software_view')
      AND visitor_id IS NOT NULL
    GROUP BY visitor_id
  )
  SELECT jsonb_build_object(
    'summary', (
      SELECT jsonb_build_object(
        'total_views', count(*)::bigint,
        'unique_visitors', count(DISTINCT visitor_id)::bigint,
        'new_visitors', (
          SELECT count(*)::bigint
          FROM period_visitors pv
          JOIN first_seen fs USING (visitor_id)
          WHERE fs.first_seen_at >= v_since
        ),
        'returning_visitors', (
          SELECT count(*)::bigint
          FROM period_visitors pv
          JOIN first_seen fs USING (visitor_id)
          WHERE fs.first_seen_at < v_since
        ),
        'sessions', count(DISTINCT session_id)::bigint,
        'views_per_session', COALESCE(round(count(*) FILTER (WHERE session_id IS NOT NULL)::numeric / NULLIF(count(DISTINCT session_id), 0), 2), 0),
        'article_views', count(*) FILTER (WHERE event_type = 'article_view')::bigint,
        'software_views', count(*) FILTER (WHERE event_type = 'software_view')::bigint,
        'other_page_views', count(*) FILTER (WHERE event_type = 'page_view')::bigint
      )
      FROM period_events
    ),
    'daily_trend', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'date', to_char(day_rows.day, 'YYYY-MM-DD'),
        'views', day_rows.views,
        'visitors', day_rows.visitors,
        'sessions', day_rows.sessions
      ) ORDER BY day_rows.day)
      FROM (
        SELECT calendar.day,
          COALESCE(daily.views, 0)::bigint AS views,
          COALESCE(daily.visitors, 0)::bigint AS visitors,
          COALESCE(daily.sessions, 0)::bigint AS sessions
        FROM generate_series(
          date_trunc('day', v_since AT TIME ZONE 'UTC'),
          date_trunc('day', now() AT TIME ZONE 'UTC'),
          interval '1 day'
        ) AS calendar(day)
        LEFT JOIN (
          SELECT date_trunc('day', created_at AT TIME ZONE 'UTC') AS day,
            count(*)::bigint AS views,
            count(DISTINCT visitor_id)::bigint AS visitors,
            count(DISTINCT session_id)::bigint AS sessions
          FROM period_events
          GROUP BY 1
        ) AS daily ON daily.day = calendar.day
      ) AS day_rows
    ), '[]'::jsonb),
    'top_articles', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', ranked.id,
        'title', ranked.title,
        'slug', ranked.slug,
        'views', ranked.views,
        'visitors', ranked.visitors
      ) ORDER BY ranked.views DESC, ranked.visitors DESC, ranked.title)
      FROM (
        SELECT article.id, article.title, article.slug,
          count(*)::bigint AS views,
          count(DISTINCT event.visitor_id)::bigint AS visitors
        FROM period_events AS event
        JOIN public.articles AS article ON article.id = event.article_id
        WHERE event.event_type = 'article_view'
          AND article.status = 'published'
          AND article.published_at <= now()
        GROUP BY article.id, article.title, article.slug
        ORDER BY count(*) DESC, count(DISTINCT event.visitor_id) DESC, article.title
        LIMIT 10
      ) AS ranked
    ), '[]'::jsonb),
    'top_software', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', ranked.id,
        'title', ranked.title,
        'slug', ranked.slug,
        'views', ranked.views,
        'visitors', ranked.visitors
      ) ORDER BY ranked.views DESC, ranked.visitors DESC, ranked.title)
      FROM (
        SELECT software.id, software.title, software.slug,
          count(*)::bigint AS views,
          count(DISTINCT event.visitor_id)::bigint AS visitors
        FROM period_events AS event
        JOIN public.software AS software ON software.id = event.software_id
        WHERE event.event_type = 'software_view'
          AND software.status = 'published'
          AND (software.published_at IS NULL OR software.published_at <= now())
        GROUP BY software.id, software.title, software.slug
        ORDER BY count(*) DESC, count(DISTINCT event.visitor_id) DESC, software.title
        LIMIT 10
      ) AS ranked
    ), '[]'::jsonb),
    'sources', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'source_type', ranked.source_type,
        'source_name', ranked.source_name,
        'referrer_host', ranked.referrer_host,
        'views', ranked.views,
        'visitors', ranked.visitors,
        'sessions', ranked.sessions
      ) ORDER BY ranked.views DESC, ranked.source_type, ranked.source_name)
      FROM (
        SELECT COALESCE(first_source_type, 'unknown') AS source_type,
          first_source_name AS source_name,
          first_referrer_host AS referrer_host,
          count(*)::bigint AS views,
          count(DISTINCT visitor_id)::bigint AS visitors,
          count(DISTINCT session_id)::bigint AS sessions
        FROM period_events
        GROUP BY 1, 2, 3
        ORDER BY count(*) DESC
        LIMIT 12
      ) AS ranked
    ), '[]'::jsonb),
    'source_domains', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'source_type', ranked.source_type,
        'referrer_host', ranked.referrer_host,
        'views', ranked.views,
        'visitors', ranked.visitors
      ) ORDER BY ranked.views DESC, ranked.visitors DESC, ranked.referrer_host)
      FROM (
        SELECT COALESCE(first_source_type, 'unknown') AS source_type,
          first_referrer_host AS referrer_host,
          count(*)::bigint AS views,
          count(DISTINCT visitor_id)::bigint AS visitors
        FROM period_events
        WHERE first_referrer_host IS NOT NULL
          AND first_source_type IN ('search','referral','campaign')
        GROUP BY 1, 2
        ORDER BY count(*) DESC, count(DISTINCT visitor_id) DESC
        LIMIT 15
      ) AS ranked
    ), '[]'::jsonb),
    'recent_external_sources', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'source_type', ranked.source_type,
        'source_name', ranked.source_name,
        'referrer_host', ranked.referrer_host,
        'views', ranked.views,
        'visitors', ranked.visitors
      ) ORDER BY ranked.views DESC, ranked.visitors DESC, ranked.referrer_host)
      FROM (
        SELECT COALESCE(last_external_source_type, 'unknown') AS source_type,
          last_external_source_name AS source_name,
          last_external_referrer_host AS referrer_host,
          count(*)::bigint AS views,
          count(DISTINCT visitor_id)::bigint AS visitors
        FROM period_events
        WHERE last_external_source_type IN ('search','referral','campaign')
        GROUP BY 1, 2, 3
        ORDER BY count(*) DESC, count(DISTINCT visitor_id) DESC
        LIMIT 15
      ) AS ranked
    ), '[]'::jsonb)
  )
  INTO v_result;

  RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_analytics(timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_analytics(timestamptz) TO authenticated;
