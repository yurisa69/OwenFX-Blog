-- Recovered historical content-platform migration.
-- This is archival migration history, not a production restore script.
CREATE TABLE IF NOT EXISTS public.admin_members (
 user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner','admin','editor')),
 active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION public.is_owenfx_admin() RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.admin_members m WHERE m.user_id=auth.uid() AND m.active=true AND m.role IN ('owner','admin'));
$$;
REVOKE ALL ON FUNCTION public.is_owenfx_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_owenfx_admin() TO anon,authenticated;
CREATE TABLE IF NOT EXISTS public.categories (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), kind TEXT NOT NULL CHECK(kind IN ('article','software')),
 name TEXT NOT NULL, slug TEXT NOT NULL, description TEXT, sort_order INTEGER NOT NULL DEFAULT 0,
 active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(kind,slug)
);
CREATE TABLE IF NOT EXISTS public.tags (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
 active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.articles (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), legacy_id TEXT UNIQUE, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
 excerpt TEXT NOT NULL DEFAULT '', content_markdown TEXT NOT NULL DEFAULT '', content_json JSONB, cover_url TEXT,
 category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL, author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
 featured BOOLEAN NOT NULL DEFAULT false, seo_title TEXT, seo_description TEXT, published_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.article_tags (
 article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
 tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE, PRIMARY KEY(article_id,tag_id)
);
CREATE TABLE IF NOT EXISTS public.article_revisions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
 editor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, title TEXT NOT NULL, excerpt TEXT NOT NULL DEFAULT '',
 content_markdown TEXT NOT NULL DEFAULT '', content_json JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.software (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), legacy_id TEXT UNIQUE, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
 description TEXT NOT NULL DEFAULT '', category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
 download_url TEXT NOT NULL, image_url TEXT, version TEXT, file_size TEXT, platform TEXT,
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
 featured BOOLEAN NOT NULL DEFAULT false, updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.software_tags (
 software_id UUID NOT NULL REFERENCES public.software(id) ON DELETE CASCADE,
 tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE, PRIMARY KEY(software_id,tag_id)
);
CREATE TABLE IF NOT EXISTS public.software_versions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), software_id UUID NOT NULL REFERENCES public.software(id) ON DELETE CASCADE,
 version TEXT NOT NULL, platform TEXT, download_url TEXT NOT NULL, file_size TEXT, changelog TEXT,
 published_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(software_id,version,platform)
);
CREATE TABLE IF NOT EXISTS public.profiles (
 id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, display_name TEXT NOT NULL DEFAULT '',
 avatar_url TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.comments (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
 author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 body TEXT NOT NULL CHECK(char_length(body) BETWEEN 1 AND 5000),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.media_assets (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
 bucket TEXT NOT NULL, object_key TEXT NOT NULL UNIQUE, public_url TEXT, mime_type TEXT NOT NULL,
 byte_size BIGINT NOT NULL CHECK(byte_size>0), alt_text TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.audit_logs (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
 action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT, details JSONB NOT NULL DEFAULT '{}'::jsonb,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS articles_publication_idx ON public.articles(status,published_at DESC);
CREATE INDEX IF NOT EXISTS articles_author_updated_idx ON public.articles(author_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS software_publication_idx ON public.software(status,updated_at DESC);
CREATE INDEX IF NOT EXISTS comments_article_status_created_idx ON public.comments(article_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS article_revisions_article_created_idx ON public.article_revisions(article_id,created_at DESC);
ALTER TABLE public.admin_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.software ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.software_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.software_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active categories" ON public.categories FOR SELECT USING(active=true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated USING(public.is_owenfx_admin()) WITH CHECK(public.is_owenfx_admin());
CREATE POLICY "Public can read active tags" ON public.tags FOR SELECT USING(active=true);
CREATE POLICY "Admins manage tags" ON public.tags FOR ALL TO authenticated USING(public.is_owenfx_admin()) WITH CHECK(public.is_owenfx_admin());
CREATE POLICY "Public can read published articles" ON public.articles FOR SELECT USING(status='published' AND published_at<=now());
CREATE POLICY "Authors read own articles" ON public.articles FOR SELECT TO authenticated USING(author_id=auth.uid());
CREATE POLICY "Admins manage articles" ON public.articles FOR ALL TO authenticated USING(public.is_owenfx_admin()) WITH CHECK(public.is_owenfx_admin());
CREATE POLICY "Public read tags on published articles" ON public.article_tags FOR SELECT USING(EXISTS(SELECT 1 FROM public.articles a WHERE a.id=article_id AND a.status='published' AND a.published_at<=now()));
CREATE POLICY "Admins manage article tags" ON public.article_tags FOR ALL TO authenticated USING(public.is_owenfx_admin()) WITH CHECK(public.is_owenfx_admin());
CREATE POLICY "Authors read own article revisions" ON public.article_revisions FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.articles a WHERE a.id=article_id AND a.author_id=auth.uid()));
CREATE POLICY "Admins manage article revisions" ON public.article_revisions FOR ALL TO authenticated USING(public.is_owenfx_admin()) WITH CHECK(public.is_owenfx_admin());
CREATE POLICY "Public can read published software" ON public.software FOR SELECT USING(status='published');
CREATE POLICY "Admins manage software" ON public.software FOR ALL TO authenticated USING(public.is_owenfx_admin()) WITH CHECK(public.is_owenfx_admin());
CREATE POLICY "Public read tags on published software" ON public.software_tags FOR SELECT USING(EXISTS(SELECT 1 FROM public.software s WHERE s.id=software_id AND s.status='published'));
CREATE POLICY "Admins manage software tags" ON public.software_tags FOR ALL TO authenticated USING(public.is_owenfx_admin()) WITH CHECK(public.is_owenfx_admin());
CREATE POLICY "Public read versions of published software" ON public.software_versions FOR SELECT USING(EXISTS(SELECT 1 FROM public.software s WHERE s.id=software_id AND s.status='published'));
CREATE POLICY "Admins manage software versions" ON public.software_versions FOR ALL TO authenticated USING(public.is_owenfx_admin()) WITH CHECK(public.is_owenfx_admin());
CREATE POLICY "Public read approved comments" ON public.comments FOR SELECT USING(status='approved');
CREATE POLICY "Users create own pending comments" ON public.comments FOR INSERT TO authenticated WITH CHECK(author_id=auth.uid() AND status='pending' AND EXISTS(SELECT 1 FROM public.articles a WHERE a.id=article_id AND a.status='published'));
CREATE POLICY "Users read own comments" ON public.comments FOR SELECT TO authenticated USING(author_id=auth.uid());
CREATE POLICY "Admins moderate comments" ON public.comments FOR ALL TO authenticated USING(public.is_owenfx_admin()) WITH CHECK(public.is_owenfx_admin());
CREATE POLICY "Owners read own media assets" ON public.media_assets FOR SELECT TO authenticated USING(owner_id=auth.uid());
CREATE POLICY "Owners add own media assets" ON public.media_assets FOR INSERT TO authenticated WITH CHECK(owner_id=auth.uid());
CREATE POLICY "Admins manage media assets" ON public.media_assets FOR ALL TO authenticated USING(public.is_owenfx_admin()) WITH CHECK(public.is_owenfx_admin());
CREATE POLICY "Admins read audit logs" ON public.audit_logs FOR SELECT TO authenticated USING(public.is_owenfx_admin());
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are publicly readable" ON public.profiles FOR SELECT USING(true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING(id=auth.uid()) WITH CHECK(id=auth.uid());
CREATE POLICY "Admins manage profiles" ON public.profiles FOR ALL TO authenticated USING(public.is_owenfx_admin()) WITH CHECK(public.is_owenfx_admin());
CREATE OR REPLACE FUNCTION public.handle_new_owenfx_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 INSERT INTO public.profiles(id,display_name) VALUES(NEW.id,COALESCE(NULLIF(NEW.raw_user_meta_data->>'display_name',''),split_part(NEW.email,'@',1))) ON CONFLICT(id) DO NOTHING;
 RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created_owenfx ON auth.users;
CREATE TRIGGER on_auth_user_created_owenfx AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_owenfx_user();
INSERT INTO public.profiles(id,display_name)
SELECT u.id,COALESCE(NULLIF(u.raw_user_meta_data->>'display_name',''),split_part(u.email,'@',1)) FROM auth.users u
ON CONFLICT(id) DO NOTHING;
CREATE INDEX IF NOT EXISTS profiles_display_name_idx ON public.profiles(display_name);
GRANT SELECT ON public.categories,public.tags,public.articles,public.article_tags,public.software,public.software_tags,public.software_versions,public.comments,public.profiles TO anon,authenticated;
GRANT INSERT ON public.comments TO authenticated;
GRANT UPDATE(display_name,avatar_url,updated_at) ON public.profiles TO authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.admin_members,public.categories,public.tags,public.articles,public.article_tags,public.article_revisions,public.software,public.software_tags,public.software_versions,public.comments,public.media_assets,public.audit_logs TO authenticated;
GRANT ALL ON public.admin_members,public.categories,public.tags,public.articles,public.article_tags,public.article_revisions,public.software,public.software_tags,public.software_versions,public.comments,public.media_assets,public.audit_logs,public.profiles TO service_role;
CREATE OR REPLACE FUNCTION public.is_owenfx_content_editor() RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.admin_members m WHERE m.user_id=auth.uid() AND m.active=true AND m.role IN ('owner','admin','editor'));
$$;
REVOKE ALL ON FUNCTION public.is_owenfx_content_editor() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_owenfx_content_editor() TO authenticated;
CREATE POLICY "Editors manage articles" ON public.articles FOR ALL TO authenticated USING(public.is_owenfx_content_editor()) WITH CHECK(public.is_owenfx_content_editor());
CREATE POLICY "Editors manage article tags" ON public.article_tags FOR ALL TO authenticated USING(public.is_owenfx_content_editor()) WITH CHECK(public.is_owenfx_content_editor());
CREATE POLICY "Editors manage article revisions" ON public.article_revisions FOR ALL TO authenticated USING(public.is_owenfx_content_editor()) WITH CHECK(public.is_owenfx_content_editor());
CREATE POLICY "Content editors append audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK(actor_id=auth.uid() AND public.is_owenfx_content_editor());
