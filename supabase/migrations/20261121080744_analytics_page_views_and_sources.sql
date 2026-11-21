-- First-party page-view analytics with privacy-preserving visitor IDs and source attribution.
ALTER TABLE public.analytics_events
  ADD COLUMN visitor_id uuid,
  ADD COLUMN source_type text,
  ADD COLUMN source_name text;

ALTER TABLE public.analytics_events DROP CONSTRAINT IF EXISTS analytics_events_event_type_check;
ALTER TABLE public.analytics_events
  ADD CONSTRAINT analytics_events_event_type_check
  CHECK (event_type IN ('software_click','wechat_click','ad_click','article_view','software_view','page_view'));
ALTER TABLE public.analytics_events
  ADD CONSTRAINT analytics_events_source_type_check
  CHECK (source_type IS NULL OR source_type IN ('direct','search','referral','internal','campaign'));

CREATE INDEX analytics_events_article_view_idx
  ON public.analytics_events (article_id, created_at DESC) WHERE event_type = 'article_view';
CREATE INDEX analytics_events_visitor_created_idx
  ON public.analytics_events (visitor_id, created_at DESC) WHERE visitor_id IS NOT NULL;
CREATE INDEX analytics_events_source_created_idx
  ON public.analytics_events (source_type, created_at DESC) WHERE source_type IS NOT NULL;

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
BEGIN
  IF NOT public.is_owenfx_admin() THEN
    RAISE EXCEPTION 'Not authorized to read analytics' USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'summary', (
      SELECT jsonb_build_object(
        'total_views', count(*)::bigint,
        'unique_visitors', count(DISTINCT visitor_id)::bigint,
        'article_views', count(*) FILTER (WHERE event_type = 'article_view')::bigint,
        'software_views', count(*) FILTER (WHERE event_type = 'software_view')::bigint,
        'other_page_views', count(*) FILTER (WHERE event_type = 'page_view')::bigint
      )
      FROM public.analytics_events
      WHERE created_at >= v_since AND event_type IN ('page_view','article_view','software_view')
    ),
    'daily_trend', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'date', to_char(day_rows.day, 'YYYY-MM-DD'),
        'views', day_rows.views,
        'visitors', day_rows.visitors
      ) ORDER BY day_rows.day)
      FROM (
        SELECT calendar.day,
          COALESCE(daily.views, 0)::bigint AS views,
          COALESCE(daily.visitors, 0)::bigint AS visitors
        FROM generate_series(
          date_trunc('day', v_since AT TIME ZONE 'UTC'),
          date_trunc('day', now() AT TIME ZONE 'UTC'),
          interval '1 day'
        ) AS calendar(day)
        LEFT JOIN (
          SELECT date_trunc('day', created_at AT TIME ZONE 'UTC') AS day,
            count(*)::bigint AS views,
            count(DISTINCT visitor_id)::bigint AS visitors
          FROM public.analytics_events
          WHERE created_at >= v_since AND event_type IN ('page_view','article_view','software_view')
          GROUP BY 1
        ) AS daily ON daily.day = calendar.day
      ) AS day_rows
    ), '[]'::jsonb),
    'top_articles', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', ranked.article_id, 'title', article.title, 'slug', article.slug, 'views', ranked.views
      ) ORDER BY ranked.views DESC, article.title)
      FROM (
        SELECT article_id, count(*)::bigint AS views
        FROM public.analytics_events
        WHERE event_type = 'article_view' AND article_id IS NOT NULL AND created_at >= v_since
        GROUP BY article_id ORDER BY count(*) DESC LIMIT 10
      ) AS ranked
      JOIN public.articles AS article ON article.id = ranked.article_id
      WHERE article.status = 'published' AND article.published_at <= now()
    ), '[]'::jsonb),
    'top_software', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', ranked.software_id, 'title', software.title, 'slug', software.slug, 'views', ranked.views
      ) ORDER BY ranked.views DESC, software.title)
      FROM (
        SELECT software_id, count(*)::bigint AS views
        FROM public.analytics_events
        WHERE event_type = 'software_view' AND software_id IS NOT NULL AND created_at >= v_since
        GROUP BY software_id ORDER BY count(*) DESC LIMIT 10
      ) AS ranked
      JOIN public.software AS software ON software.id = ranked.software_id
      WHERE software.status = 'published'
        AND (software.published_at IS NULL OR software.published_at <= now())
    ), '[]'::jsonb),
    'sources', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'source_type', ranked.source_type,
        'source_name', ranked.source_name,
        'referrer_host', ranked.referrer_host,
        'views', ranked.views,
        'visitors', ranked.visitors
      ) ORDER BY ranked.views DESC, ranked.source_type, ranked.referrer_host)
      FROM (
        SELECT COALESCE(source_type, 'unknown') AS source_type,
          source_name, referrer_host,
          count(*)::bigint AS views,
          count(DISTINCT visitor_id)::bigint AS visitors
        FROM public.analytics_events
        WHERE created_at >= v_since AND event_type IN ('page_view','article_view','software_view')
        GROUP BY 1, 2, 3
        ORDER BY count(*) DESC LIMIT 12
      ) AS ranked
    ), '[]'::jsonb)
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_analytics(timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_analytics(timestamptz) TO authenticated;
