CREATE TABLE IF NOT EXISTS public.article_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  interaction_type text not null check (interaction_type in ('bookmark','like')),
  created_at timestamptz not null default now(),
  constraint article_interactions_user_article_type_key unique (user_id, article_id, interaction_type)
);
CREATE INDEX IF NOT EXISTS article_interactions_user_type_created_idx
  ON public.article_interactions (user_id, interaction_type, created_at desc);
ALTER TABLE public.article_interactions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.article_interactions TO authenticated;
CREATE POLICY "Users read own article interactions" ON public.article_interactions
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "Users create own article interactions" ON public.article_interactions
  FOR INSERT TO authenticated WITH CHECK (
    (select auth.uid()) = user_id
    AND EXISTS (SELECT 1 FROM public.articles a WHERE a.id = article_id AND a.status = 'published' AND a.published_at <= now())
  );
CREATE POLICY "Users delete own article interactions" ON public.article_interactions
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
