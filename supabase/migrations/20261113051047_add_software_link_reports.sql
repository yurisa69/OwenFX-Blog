CREATE TABLE IF NOT EXISTS public.software_link_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  software_id uuid NOT NULL REFERENCES public.software(id) ON DELETE RESTRICT,
  download_link_id uuid REFERENCES public.software_download_links(id) ON DELETE SET NULL,
  software_title text NOT NULL,
  provider text NOT NULL,
  share_url text NOT NULL,
  reason text NOT NULL CHECK (reason = ANY (ARRAY['expired'::text, 'not_found'::text, 'password_invalid'::text, 'access_denied'::text, 'other'::text])),
  details text CHECK (details IS NULL OR char_length(details) <= 800),
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending'::text, 'reviewed'::text, 'resolved'::text, 'dismissed'::text])),
  admin_note text CHECK (admin_note IS NULL OR char_length(admin_note) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS software_link_reports_status_created_idx
  ON public.software_link_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS software_link_reports_reporter_created_idx
  ON public.software_link_reports (reporter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS software_link_reports_software_created_idx
  ON public.software_link_reports (software_id, created_at DESC);

ALTER TABLE public.software_link_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.software_link_reports FROM PUBLIC, anon;
GRANT SELECT, UPDATE ON TABLE public.software_link_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.software_link_reports TO service_role;

CREATE POLICY "Admins manage software link reports"
  ON public.software_link_reports
  FOR ALL
  TO authenticated
  USING (public.is_owenfx_admin())
  WITH CHECK (public.is_owenfx_admin());
