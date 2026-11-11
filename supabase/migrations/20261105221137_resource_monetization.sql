-- Reconciled historical migration.
-- Retained objects verified in production: site_promotions, site_settings,
-- analytics_events. Excluded retired cloud_resources/cloud_resource_links,
-- analytics_events.resource_id, resource_click, and their indexes/policies.
CREATE TABLE IF NOT EXISTS public.site_promotions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), key TEXT NOT NULL UNIQUE, title TEXT NOT NULL DEFAULT '',
 target_url TEXT, image_url TEXT, body TEXT,
 placement TEXT NOT NULL CHECK(placement IN ('site_header','article_end','resource_detail','sidebar','footer')),
 active BOOLEAN NOT NULL DEFAULT false, starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ, updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.site_settings (
 key TEXT PRIMARY KEY, value JSONB NOT NULL DEFAULT '{}'::jsonb, updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.analytics_events (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 event_type TEXT NOT NULL CHECK(event_type IN ('wechat_click','ad_click','article_view')),
 article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL, target_key TEXT, referrer_host TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS analytics_events_type_created_idx ON public.analytics_events(event_type,created_at DESC);
ALTER TABLE public.site_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active promotions" ON public.site_promotions FOR SELECT USING(active=true AND (starts_at IS NULL OR starts_at<=now()) AND (ends_at IS NULL OR ends_at>now()));
CREATE POLICY "Admins manage promotions" ON public.site_promotions FOR ALL TO authenticated USING(public.is_owenfx_admin()) WITH CHECK(public.is_owenfx_admin());
CREATE POLICY "Public read public settings" ON public.site_settings FOR SELECT USING(key IN ('wechat_public','monetization_public'));
CREATE POLICY "Admins manage settings" ON public.site_settings FOR ALL TO authenticated USING(public.is_owenfx_admin()) WITH CHECK(public.is_owenfx_admin());
CREATE POLICY "Public insert analytics events" ON public.analytics_events FOR INSERT TO anon,authenticated WITH CHECK(event_type IN ('wechat_click','ad_click','article_view'));
CREATE POLICY "Admins read analytics events" ON public.analytics_events FOR SELECT TO authenticated USING(public.is_owenfx_admin());
