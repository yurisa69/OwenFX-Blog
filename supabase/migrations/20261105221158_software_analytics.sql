-- Reconciled analytics extension; resource_click was retired.
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS software_id UUID REFERENCES public.software(id) ON DELETE SET NULL;
ALTER TABLE public.analytics_events DROP CONSTRAINT IF EXISTS analytics_events_event_type_check;
ALTER TABLE public.analytics_events ADD CONSTRAINT analytics_events_event_type_check CHECK(event_type IN ('software_click','wechat_click','ad_click','article_view'));
CREATE INDEX IF NOT EXISTS analytics_events_software_idx ON public.analytics_events(software_id,created_at DESC);
DROP POLICY IF EXISTS "Public insert analytics events" ON public.analytics_events;
CREATE POLICY "Public insert analytics events" ON public.analytics_events FOR INSERT TO anon,authenticated WITH CHECK(event_type IN ('software_click','wechat_click','ad_click','article_view'));
GRANT INSERT ON public.analytics_events TO anon,authenticated;
GRANT SELECT ON public.analytics_events TO authenticated;
