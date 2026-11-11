-- Keep scheduled software and its tags private until their publication time.
ALTER POLICY "Public can read published software"
  ON public.software
  USING (
    status = 'published'
    AND (published_at IS NULL OR published_at <= now())
  );

ALTER POLICY "Public read tags on published software"
  ON public.software_tags
  USING (
    EXISTS (
      SELECT 1
      FROM public.software AS s
      WHERE s.id = software_tags.software_id
        AND s.status = 'published'
        AND (s.published_at IS NULL OR s.published_at <= now())
    )
  );

-- Admin-only management policies must not target the public role.
ALTER POLICY "Admins manage software download links"
  ON public.software_download_links
  TO authenticated;

ALTER POLICY "Admins manage support settings"
  ON public.support_settings
  TO authenticated;

-- Evaluate stable auth claims once per statement rather than once per row.
ALTER POLICY "Authors read own articles"
  ON public.articles
  USING (author_id = (SELECT auth.uid()));

ALTER POLICY "Authors read own article revisions"
  ON public.article_revisions
  USING (
    EXISTS (
      SELECT 1
      FROM public.articles AS a
      WHERE a.id = article_revisions.article_id
        AND a.author_id = (SELECT auth.uid())
    )
  );

ALTER POLICY "Users create own pending comments"
  ON public.comments
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND status = 'pending'
    AND EXISTS (
      SELECT 1
      FROM public.articles AS a
      WHERE a.id = comments.article_id
        AND a.status = 'published'
    )
  );

ALTER POLICY "Users read own comments"
  ON public.comments
  USING (author_id = (SELECT auth.uid()));

ALTER POLICY "Users update own profile"
  ON public.profiles
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

ALTER POLICY "Content editors append audit logs"
  ON public.audit_logs
  WITH CHECK (
    actor_id = (SELECT auth.uid())
    AND (SELECT public.is_owenfx_content_editor())
  );

-- SECURITY DEFINER helpers are only needed by authenticated RLS policies and
-- trusted server-side code. Trigger functions are not public RPC endpoints.
REVOKE ALL ON FUNCTION public.handle_new_owenfx_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.is_owenfx_admin() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_owenfx_admin() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_owenfx_content_editor() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_owenfx_content_editor() TO authenticated, service_role;
