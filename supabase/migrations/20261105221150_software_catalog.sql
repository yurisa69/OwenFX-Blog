-- Recovered historical software catalogue migration.
ALTER TABLE public.software ALTER COLUMN download_url DROP NOT NULL,
 ADD COLUMN IF NOT EXISTS developer TEXT, ADD COLUMN IF NOT EXISTS official_download_url TEXT,
 ADD COLUMN IF NOT EXISTS introduction_markdown TEXT NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS screenshots JSONB NOT NULL DEFAULT '[]'::jsonb,
 ADD COLUMN IF NOT EXISTS featured_order INTEGER NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
UPDATE public.software SET official_download_url=COALESCE(official_download_url,download_url) WHERE official_download_url IS NULL AND download_url IS NOT NULL;
CREATE TABLE IF NOT EXISTS public.software_download_links (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), software_id UUID NOT NULL REFERENCES public.software(id) ON DELETE CASCADE,
 provider TEXT NOT NULL CHECK(provider IN ('baidu','quark','aliyun','tianyi','123pan','other')),
 label TEXT NOT NULL DEFAULT '网盘下载', share_url TEXT NOT NULL, access_code TEXT,
 sort_order INTEGER NOT NULL DEFAULT 0, active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS software_featured_idx ON public.software(status,featured,featured_order,updated_at DESC);
CREATE INDEX IF NOT EXISTS software_download_links_idx ON public.software_download_links(software_id,active,sort_order);
ALTER TABLE public.software_download_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read links for published software" ON public.software_download_links FOR SELECT USING(active=true AND EXISTS(SELECT 1 FROM public.software s WHERE s.id=software_id AND s.status='published' AND (s.published_at IS NULL OR s.published_at<=now())));
CREATE POLICY "Admins manage software download links" ON public.software_download_links FOR ALL USING(public.is_owenfx_admin()) WITH CHECK(public.is_owenfx_admin());
CREATE TABLE IF NOT EXISTS public.support_settings (
 placement TEXT PRIMARY KEY CHECK(placement IN ('article','software')), enabled BOOLEAN NOT NULL DEFAULT true,
 methods JSONB NOT NULL DEFAULT '{"alipay":{"enabled":false,"qr_url":""},"wechat":{"enabled":false,"qr_url":""},"usdc":{"enabled":false,"address":"","network":""},"usdt":{"enabled":false,"address":"","network":""}}'::jsonb,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.support_settings(placement) VALUES('article'),('software') ON CONFLICT(placement) DO NOTHING;
ALTER TABLE public.support_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read enabled support settings" ON public.support_settings FOR SELECT USING(enabled=true);
CREATE POLICY "Admins manage support settings" ON public.support_settings FOR ALL USING(public.is_owenfx_admin()) WITH CHECK(public.is_owenfx_admin());
GRANT SELECT ON public.software_download_links,public.support_settings TO anon,authenticated;
GRANT INSERT,UPDATE,DELETE ON public.software_download_links,public.support_settings TO authenticated;
