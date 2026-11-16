BEGIN;

-- Replace the inherited schema with a new, feedback-only table.
-- The previous table was verified to contain zero rows before this migration.
DROP TABLE IF EXISTS public.software_link_feedbacks;

CREATE TABLE public.software_link_feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  software_id uuid NULL,
  download_link_id uuid NULL,
  software_title text NOT NULL,
  provider text NOT NULL,
  share_url text NOT NULL,
  reason text NOT NULL,
  details text NULL,
  user_id uuid NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_note text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT software_link_feedbacks_software_id_fkey
    FOREIGN KEY (software_id) REFERENCES public.software(id) ON DELETE SET NULL,
  CONSTRAINT software_link_feedbacks_download_link_id_fkey
    FOREIGN KEY (download_link_id) REFERENCES public.software_download_links(id) ON DELETE SET NULL,
  CONSTRAINT software_link_feedbacks_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT software_link_feedbacks_reason_check
    CHECK (reason IN ('expired', 'not_found', 'password_invalid', 'access_denied', 'other')),
  CONSTRAINT software_link_feedbacks_details_check
    CHECK (details IS NULL OR char_length(details) <= 800),
  CONSTRAINT software_link_feedbacks_status_check
    CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  CONSTRAINT software_link_feedbacks_admin_note_check
    CHECK (admin_note IS NULL OR char_length(admin_note) <= 500)
);

CREATE INDEX software_link_feedbacks_status_created_idx
  ON public.software_link_feedbacks (status, created_at DESC);
CREATE INDEX software_link_feedbacks_software_created_idx
  ON public.software_link_feedbacks (software_id, created_at DESC);
CREATE INDEX software_link_feedbacks_user_created_idx
  ON public.software_link_feedbacks (user_id, created_at DESC);
CREATE INDEX software_link_feedbacks_download_link_idx
  ON public.software_link_feedbacks (download_link_id);

ALTER TABLE public.software_link_feedbacks ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.software_link_feedbacks FROM PUBLIC, anon, authenticated;
GRANT SELECT, UPDATE ON TABLE public.software_link_feedbacks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.software_link_feedbacks TO service_role;

CREATE POLICY "Admins manage software link feedback"
  ON public.software_link_feedbacks
  FOR ALL
  TO authenticated
  USING (public.is_owenfx_admin())
  WITH CHECK (public.is_owenfx_admin());

COMMENT ON TABLE public.software_link_feedbacks IS
  '用户提交的网盘下载链接失效反馈及后台处理记录';

COMMIT;
