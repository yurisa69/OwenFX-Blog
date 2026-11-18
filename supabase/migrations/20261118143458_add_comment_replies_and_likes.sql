ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS parent_comment_id uuid
  REFERENCES public.comments(id) ON DELETE CASCADE;

ALTER TABLE public.comments
  ADD CONSTRAINT comments_parent_not_self_check
  CHECK (parent_comment_id IS NULL OR parent_comment_id <> id);

CREATE INDEX IF NOT EXISTS comments_parent_created_idx
  ON public.comments(parent_comment_id, created_at ASC)
  WHERE parent_comment_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.comment_likes (
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS comment_likes_user_created_idx
  ON public.comment_likes(user_id, created_at DESC);

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read likes on visible comments"
  ON public.comment_likes FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.comments c
    JOIN public.articles a ON a.id = c.article_id
    WHERE c.id = comment_likes.comment_id AND c.status = 'approved'
      AND c.deleted_at IS NULL AND a.status = 'published' AND a.published_at <= now()
  ));

CREATE POLICY "Users like visible comments"
  ON public.comment_likes FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.comments c
    JOIN public.articles a ON a.id = c.article_id
    WHERE c.id = comment_likes.comment_id AND c.status = 'approved'
      AND c.deleted_at IS NULL AND a.status = 'published' AND a.published_at <= now()
  ));

CREATE POLICY "Users remove own comment likes"
  ON public.comment_likes FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

GRANT SELECT ON public.comment_likes TO anon, authenticated;
GRANT INSERT, DELETE ON public.comment_likes TO authenticated;
GRANT ALL ON public.comment_likes TO service_role;
