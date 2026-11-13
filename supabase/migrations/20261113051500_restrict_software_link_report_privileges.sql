REVOKE ALL ON TABLE public.software_link_reports FROM authenticated;
GRANT SELECT, UPDATE ON TABLE public.software_link_reports TO authenticated;

CREATE INDEX IF NOT EXISTS software_link_reports_download_link_idx
  ON public.software_link_reports (download_link_id);
