-- OwenFX production public-schema structural baseline
-- Captured: 2026-11-13 | PostgreSQL 17.11
-- Project ref: gjzxultalptqwqmpagzj
-- Structure only; no application rows, Auth users, or business data are included.
-- Scope: public tables, constraints, indexes, functions, RLS policies and table grants.
-- Supabase-managed schemas and platform roles are external dependencies.
-- This catalog-derived snapshot is not a complete Supabase platform backup.
-- It is a reference/bootstrap artifact, not an incremental migration.
-- Do not run this file against the existing production database.
-- Future production changes must be incremental SQL files in supabase/migrations.
-- TABLE: public.admin_members
CREATE TABLE public.admin_members (
  user_id uuid NOT NULL,
  role text DEFAULT 'editor'::text NOT NULL,
  active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- TABLE: public.analytics_events
CREATE TABLE public.analytics_events (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  event_type text NOT NULL,
  article_id uuid,
  target_key text,
  referrer_host text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  software_id uuid
);

-- TABLE: public.api_devices
CREATE TABLE public.api_devices (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  token_hash text NOT NULL,
  scopes text[] DEFAULT ARRAY['articles:import'::text] NOT NULL,
  active boolean DEFAULT true NOT NULL,
  expires_at timestamp with time zone,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- TABLE: public.article_interactions
CREATE TABLE public.article_interactions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  article_id uuid NOT NULL,
  interaction_type text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- TABLE: public.article_revisions
CREATE TABLE public.article_revisions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  article_id uuid NOT NULL,
  editor_id uuid,
  title text NOT NULL,
  excerpt text DEFAULT ''::text NOT NULL,
  content_markdown text DEFAULT ''::text NOT NULL,
  content_json jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  github_path text,
  github_sha text,
  content_hash text
);

-- TABLE: public.article_tags
CREATE TABLE public.article_tags (
  article_id uuid NOT NULL,
  tag_id uuid NOT NULL
);

-- TABLE: public.articles
CREATE TABLE public.articles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  legacy_id text,
  title text NOT NULL,
  slug text NOT NULL,
  excerpt text DEFAULT ''::text NOT NULL,
  content_markdown text DEFAULT ''::text NOT NULL,
  content_json jsonb,
  cover_url text,
  category_id uuid,
  author_id uuid,
  status text DEFAULT 'draft'::text NOT NULL,
  featured boolean DEFAULT false NOT NULL,
  seo_title text,
  seo_description text,
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  legacy_author text,
  github_path text,
  github_sha text,
  content_hash text
);

-- TABLE: public.audit_logs
CREATE TABLE public.audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  actor_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- TABLE: public.categories
CREATE TABLE public.categories (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  kind text NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  sort_order integer DEFAULT 0 NOT NULL,
  active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- TABLE: public.comments
CREATE TABLE public.comments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  article_id uuid NOT NULL,
  author_id uuid NOT NULL,
  body text NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- TABLE: public.media_assets
CREATE TABLE public.media_assets (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  owner_id uuid,
  bucket text NOT NULL,
  object_key text NOT NULL,
  public_url text,
  mime_type text NOT NULL,
  byte_size bigint NOT NULL,
  alt_text text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  media_kind text DEFAULT 'image'::text NOT NULL,
  original_filename text,
  entity_type text,
  entity_id uuid,
  upload_status text DEFAULT 'ready'::text NOT NULL,
  width integer,
  height integer,
  duration_seconds numeric(10,2),
  etag text
);

-- TABLE: public.profiles
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  display_name text DEFAULT ''::text NOT NULL,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  bio text
);

-- TABLE: public.site_promotions
CREATE TABLE public.site_promotions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  key text NOT NULL,
  title text DEFAULT ''::text NOT NULL,
  target_url text,
  image_url text,
  body text,
  placement text NOT NULL,
  active boolean DEFAULT false NOT NULL,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- TABLE: public.site_settings
CREATE TABLE public.site_settings (
  key text NOT NULL,
  value jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_by uuid,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- TABLE: public.software
CREATE TABLE public.software (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  legacy_id text,
  title text NOT NULL,
  slug text NOT NULL,
  description text DEFAULT ''::text NOT NULL,
  category_id uuid,
  download_url text,
  image_url text,
  version text,
  file_size text,
  platform text,
  status text DEFAULT 'draft'::text NOT NULL,
  featured boolean DEFAULT false NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  developer text,
  official_download_url text,
  introduction_markdown text DEFAULT ''::text NOT NULL,
  screenshots jsonb DEFAULT '[]'::jsonb NOT NULL,
  featured_order integer DEFAULT 0 NOT NULL,
  published_at timestamp with time zone
);

-- TABLE: public.software_download_links
CREATE TABLE public.software_download_links (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  software_id uuid NOT NULL,
  provider text NOT NULL,
  label text DEFAULT '网盘下载'::text NOT NULL,
  share_url text NOT NULL,
  access_code text,
  sort_order integer DEFAULT 0 NOT NULL,
  active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- TABLE: public.software_tags
CREATE TABLE public.software_tags (
  software_id uuid NOT NULL,
  tag_id uuid NOT NULL
);

-- TABLE: public.software_versions
CREATE TABLE public.software_versions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  software_id uuid NOT NULL,
  version text NOT NULL,
  platform text,
  download_url text NOT NULL,
  file_size text,
  changelog text,
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- TABLE: public.support_settings
CREATE TABLE public.support_settings (
  placement text NOT NULL,
  enabled boolean DEFAULT true NOT NULL,
  methods jsonb DEFAULT '{"usdc": {"address": "", "enabled": false, "network": ""}, "usdt": {"address": "", "enabled": false, "network": ""}, "alipay": {"qr_url": "", "enabled": false}, "wechat": {"qr_url": "", "enabled": false}}'::jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- TABLE: public.tags
CREATE TABLE public.tags (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- CONSTRAINT: public.admin_members.admin_members_pkey
ALTER TABLE public.admin_members ADD CONSTRAINT admin_members_pkey PRIMARY KEY (user_id);

-- CONSTRAINT: public.admin_members.admin_members_role_check
ALTER TABLE public.admin_members ADD CONSTRAINT admin_members_role_check CHECK (role = ANY (ARRAY['owner'::text, 'admin'::text, 'editor'::text]));

-- CONSTRAINT: public.admin_members.admin_members_user_id_fkey
ALTER TABLE public.admin_members ADD CONSTRAINT admin_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- CONSTRAINT: public.analytics_events.analytics_events_article_id_fkey
ALTER TABLE public.analytics_events ADD CONSTRAINT analytics_events_article_id_fkey FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL;

-- CONSTRAINT: public.analytics_events.analytics_events_event_type_check
ALTER TABLE public.analytics_events ADD CONSTRAINT analytics_events_event_type_check CHECK (event_type = ANY (ARRAY['software_click'::text, 'wechat_click'::text, 'ad_click'::text, 'article_view'::text]));

-- CONSTRAINT: public.analytics_events.analytics_events_pkey
ALTER TABLE public.analytics_events ADD CONSTRAINT analytics_events_pkey PRIMARY KEY (id);

-- CONSTRAINT: public.analytics_events.analytics_events_software_id_fkey
ALTER TABLE public.analytics_events ADD CONSTRAINT analytics_events_software_id_fkey FOREIGN KEY (software_id) REFERENCES software(id) ON DELETE SET NULL;

-- CONSTRAINT: public.api_devices.api_devices_name_check
ALTER TABLE public.api_devices ADD CONSTRAINT api_devices_name_check CHECK (char_length(name) >= 1 AND char_length(name) <= 100);

-- CONSTRAINT: public.api_devices.api_devices_pkey
ALTER TABLE public.api_devices ADD CONSTRAINT api_devices_pkey PRIMARY KEY (id);

-- CONSTRAINT: public.api_devices.api_devices_token_hash_key
ALTER TABLE public.api_devices ADD CONSTRAINT api_devices_token_hash_key UNIQUE (token_hash);

-- CONSTRAINT: public.api_devices.api_devices_user_id_fkey
ALTER TABLE public.api_devices ADD CONSTRAINT api_devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- CONSTRAINT: public.article_interactions.article_interactions_article_id_fkey
ALTER TABLE public.article_interactions ADD CONSTRAINT article_interactions_article_id_fkey FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE;

-- CONSTRAINT: public.article_interactions.article_interactions_interaction_type_check
ALTER TABLE public.article_interactions ADD CONSTRAINT article_interactions_interaction_type_check CHECK (interaction_type = ANY (ARRAY['bookmark'::text, 'like'::text]));

-- CONSTRAINT: public.article_interactions.article_interactions_pkey
ALTER TABLE public.article_interactions ADD CONSTRAINT article_interactions_pkey PRIMARY KEY (id);

-- CONSTRAINT: public.article_interactions.article_interactions_user_article_type_key
ALTER TABLE public.article_interactions ADD CONSTRAINT article_interactions_user_article_type_key UNIQUE (user_id, article_id, interaction_type);

-- CONSTRAINT: public.article_interactions.article_interactions_user_id_fkey
ALTER TABLE public.article_interactions ADD CONSTRAINT article_interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- CONSTRAINT: public.article_revisions.article_revisions_article_id_fkey
ALTER TABLE public.article_revisions ADD CONSTRAINT article_revisions_article_id_fkey FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE;

-- CONSTRAINT: public.article_revisions.article_revisions_editor_id_fkey
ALTER TABLE public.article_revisions ADD CONSTRAINT article_revisions_editor_id_fkey FOREIGN KEY (editor_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- CONSTRAINT: public.article_revisions.article_revisions_pkey
ALTER TABLE public.article_revisions ADD CONSTRAINT article_revisions_pkey PRIMARY KEY (id);

-- CONSTRAINT: public.article_tags.article_tags_article_id_fkey
ALTER TABLE public.article_tags ADD CONSTRAINT article_tags_article_id_fkey FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE;

-- CONSTRAINT: public.article_tags.article_tags_pkey
ALTER TABLE public.article_tags ADD CONSTRAINT article_tags_pkey PRIMARY KEY (article_id, tag_id);

-- CONSTRAINT: public.article_tags.article_tags_tag_id_fkey
ALTER TABLE public.article_tags ADD CONSTRAINT article_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE;

-- CONSTRAINT: public.articles.articles_author_id_fkey
ALTER TABLE public.articles ADD CONSTRAINT articles_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- CONSTRAINT: public.articles.articles_category_id_fkey
ALTER TABLE public.articles ADD CONSTRAINT articles_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- CONSTRAINT: public.articles.articles_legacy_id_key
ALTER TABLE public.articles ADD CONSTRAINT articles_legacy_id_key UNIQUE (legacy_id);

-- CONSTRAINT: public.articles.articles_pkey
ALTER TABLE public.articles ADD CONSTRAINT articles_pkey PRIMARY KEY (id);

-- CONSTRAINT: public.articles.articles_slug_key
ALTER TABLE public.articles ADD CONSTRAINT articles_slug_key UNIQUE (slug);

-- CONSTRAINT: public.articles.articles_status_check
ALTER TABLE public.articles ADD CONSTRAINT articles_status_check CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text]));

-- CONSTRAINT: public.audit_logs.audit_logs_actor_id_fkey
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- CONSTRAINT: public.audit_logs.audit_logs_pkey
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);

-- CONSTRAINT: public.categories.categories_kind_check
ALTER TABLE public.categories ADD CONSTRAINT categories_kind_check CHECK (kind = ANY (ARRAY['article'::text, 'software'::text]));

-- CONSTRAINT: public.categories.categories_kind_slug_key
ALTER TABLE public.categories ADD CONSTRAINT categories_kind_slug_key UNIQUE (kind, slug);

-- CONSTRAINT: public.categories.categories_pkey
ALTER TABLE public.categories ADD CONSTRAINT categories_pkey PRIMARY KEY (id);

-- CONSTRAINT: public.comments.comments_article_id_fkey
ALTER TABLE public.comments ADD CONSTRAINT comments_article_id_fkey FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE;

-- CONSTRAINT: public.comments.comments_author_id_profiles_fkey
ALTER TABLE public.comments ADD CONSTRAINT comments_author_id_profiles_fkey FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- CONSTRAINT: public.comments.comments_body_check
ALTER TABLE public.comments ADD CONSTRAINT comments_body_check CHECK (char_length(body) >= 1 AND char_length(body) <= 5000);

-- CONSTRAINT: public.comments.comments_pkey
ALTER TABLE public.comments ADD CONSTRAINT comments_pkey PRIMARY KEY (id);

-- CONSTRAINT: public.comments.comments_status_check
ALTER TABLE public.comments ADD CONSTRAINT comments_status_check CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]));

-- CONSTRAINT: public.media_assets.media_assets_byte_size_check
ALTER TABLE public.media_assets ADD CONSTRAINT media_assets_byte_size_check CHECK (byte_size > 0);

-- CONSTRAINT: public.media_assets.media_assets_media_kind_check
ALTER TABLE public.media_assets ADD CONSTRAINT media_assets_media_kind_check CHECK (media_kind = ANY (ARRAY['image'::text, 'avatar'::text, 'background'::text, 'software_icon'::text, 'video'::text, 'comment_image'::text, 'attachment'::text]));

-- CONSTRAINT: public.media_assets.media_assets_object_key_key
ALTER TABLE public.media_assets ADD CONSTRAINT media_assets_object_key_key UNIQUE (object_key);

-- CONSTRAINT: public.media_assets.media_assets_owner_id_fkey
ALTER TABLE public.media_assets ADD CONSTRAINT media_assets_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- CONSTRAINT: public.media_assets.media_assets_pkey
ALTER TABLE public.media_assets ADD CONSTRAINT media_assets_pkey PRIMARY KEY (id);

-- CONSTRAINT: public.media_assets.media_assets_upload_status_check
ALTER TABLE public.media_assets ADD CONSTRAINT media_assets_upload_status_check CHECK (upload_status = ANY (ARRAY['pending'::text, 'ready'::text, 'failed'::text, 'deleted'::text]));

-- CONSTRAINT: public.profiles.profiles_id_fkey
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- CONSTRAINT: public.profiles.profiles_pkey
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

-- CONSTRAINT: public.site_promotions.site_promotions_key_key
ALTER TABLE public.site_promotions ADD CONSTRAINT site_promotions_key_key UNIQUE (key);

-- CONSTRAINT: public.site_promotions.site_promotions_pkey
ALTER TABLE public.site_promotions ADD CONSTRAINT site_promotions_pkey PRIMARY KEY (id);

-- CONSTRAINT: public.site_promotions.site_promotions_placement_check
ALTER TABLE public.site_promotions ADD CONSTRAINT site_promotions_placement_check CHECK (placement = ANY (ARRAY['site_header'::text, 'article_end'::text, 'resource_detail'::text, 'sidebar'::text, 'footer'::text]));

-- CONSTRAINT: public.site_settings.site_settings_pkey
ALTER TABLE public.site_settings ADD CONSTRAINT site_settings_pkey PRIMARY KEY (key);

-- CONSTRAINT: public.site_settings.site_settings_updated_by_fkey
ALTER TABLE public.site_settings ADD CONSTRAINT site_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- CONSTRAINT: public.software.software_category_id_fkey
ALTER TABLE public.software ADD CONSTRAINT software_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- CONSTRAINT: public.software.software_legacy_id_key
ALTER TABLE public.software ADD CONSTRAINT software_legacy_id_key UNIQUE (legacy_id);

-- CONSTRAINT: public.software.software_pkey
ALTER TABLE public.software ADD CONSTRAINT software_pkey PRIMARY KEY (id);

-- CONSTRAINT: public.software.software_slug_key
ALTER TABLE public.software ADD CONSTRAINT software_slug_key UNIQUE (slug);

-- CONSTRAINT: public.software.software_status_check
ALTER TABLE public.software ADD CONSTRAINT software_status_check CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text]));

-- CONSTRAINT: public.software_download_links.software_download_links_pkey
ALTER TABLE public.software_download_links ADD CONSTRAINT software_download_links_pkey PRIMARY KEY (id);

-- CONSTRAINT: public.software_download_links.software_download_links_provider_check
ALTER TABLE public.software_download_links ADD CONSTRAINT software_download_links_provider_check CHECK (provider = ANY (ARRAY['baidu'::text, 'quark'::text, 'aliyun'::text, 'tianyi'::text, '123pan'::text, 'other'::text]));

-- CONSTRAINT: public.software_download_links.software_download_links_software_id_fkey
ALTER TABLE public.software_download_links ADD CONSTRAINT software_download_links_software_id_fkey FOREIGN KEY (software_id) REFERENCES software(id) ON DELETE CASCADE;

-- CONSTRAINT: public.software_tags.software_tags_pkey
ALTER TABLE public.software_tags ADD CONSTRAINT software_tags_pkey PRIMARY KEY (software_id, tag_id);

-- CONSTRAINT: public.software_tags.software_tags_software_id_fkey
ALTER TABLE public.software_tags ADD CONSTRAINT software_tags_software_id_fkey FOREIGN KEY (software_id) REFERENCES software(id) ON DELETE CASCADE;

-- CONSTRAINT: public.software_tags.software_tags_tag_id_fkey
ALTER TABLE public.software_tags ADD CONSTRAINT software_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE;

-- CONSTRAINT: public.software_versions.software_versions_pkey
ALTER TABLE public.software_versions ADD CONSTRAINT software_versions_pkey PRIMARY KEY (id);

-- CONSTRAINT: public.software_versions.software_versions_software_id_fkey
ALTER TABLE public.software_versions ADD CONSTRAINT software_versions_software_id_fkey FOREIGN KEY (software_id) REFERENCES software(id) ON DELETE CASCADE;

-- CONSTRAINT: public.software_versions.software_versions_software_id_version_platform_key
ALTER TABLE public.software_versions ADD CONSTRAINT software_versions_software_id_version_platform_key UNIQUE (software_id, version, platform);

-- CONSTRAINT: public.support_settings.support_settings_pkey
ALTER TABLE public.support_settings ADD CONSTRAINT support_settings_pkey PRIMARY KEY (placement);

-- CONSTRAINT: public.support_settings.support_settings_placement_check
ALTER TABLE public.support_settings ADD CONSTRAINT support_settings_placement_check CHECK (placement = ANY (ARRAY['article'::text, 'software'::text]));

-- CONSTRAINT: public.tags.tags_pkey
ALTER TABLE public.tags ADD CONSTRAINT tags_pkey PRIMARY KEY (id);

-- CONSTRAINT: public.tags.tags_slug_key
ALTER TABLE public.tags ADD CONSTRAINT tags_slug_key UNIQUE (slug);

-- INDEX: public.analytics_events.analytics_events_software_idx
CREATE INDEX analytics_events_software_idx ON public.analytics_events USING btree (software_id, created_at DESC);

-- INDEX: public.analytics_events.analytics_events_type_created_idx
CREATE INDEX analytics_events_type_created_idx ON public.analytics_events USING btree (event_type, created_at DESC);

-- INDEX: public.api_devices.api_devices_user_created_idx
CREATE INDEX api_devices_user_created_idx ON public.api_devices USING btree (user_id, created_at DESC);

-- INDEX: public.article_interactions.article_interactions_user_type_created_idx
CREATE INDEX article_interactions_user_type_created_idx ON public.article_interactions USING btree (user_id, interaction_type, created_at DESC);

-- INDEX: public.article_revisions.article_revisions_article_created_idx
CREATE INDEX article_revisions_article_created_idx ON public.article_revisions USING btree (article_id, created_at DESC);

-- INDEX: public.articles.articles_author_updated_idx
CREATE INDEX articles_author_updated_idx ON public.articles USING btree (author_id, updated_at DESC);

-- INDEX: public.articles.articles_publication_idx
CREATE INDEX articles_publication_idx ON public.articles USING btree (status, published_at DESC);

-- INDEX: public.comments.comments_article_status_created_idx
CREATE INDEX comments_article_status_created_idx ON public.comments USING btree (article_id, status, created_at DESC);

-- INDEX: public.media_assets.media_assets_entity_idx
CREATE INDEX media_assets_entity_idx ON public.media_assets USING btree (entity_type, entity_id) WHERE (entity_id IS NOT NULL);

-- INDEX: public.media_assets.media_assets_owner_kind_created_idx
CREATE INDEX media_assets_owner_kind_created_idx ON public.media_assets USING btree (owner_id, media_kind, created_at DESC);

-- INDEX: public.profiles.profiles_display_name_idx
CREATE INDEX profiles_display_name_idx ON public.profiles USING btree (display_name);

-- INDEX: public.software.software_featured_idx
CREATE INDEX software_featured_idx ON public.software USING btree (status, featured, featured_order, updated_at DESC);

-- INDEX: public.software.software_publication_idx
CREATE INDEX software_publication_idx ON public.software USING btree (status, updated_at DESC);

-- INDEX: public.software_download_links.software_download_links_idx
CREATE INDEX software_download_links_idx ON public.software_download_links USING btree (software_id, active, sort_order);

-- FUNCTION: public.handle_new_owenfx_user()
CREATE OR REPLACE FUNCTION public.handle_new_owenfx_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
 INSERT INTO public.profiles(id,display_name) VALUES(NEW.id,COALESCE(NULLIF(NEW.raw_user_meta_data->>'display_name',''),split_part(NEW.email,'@',1))) ON CONFLICT(id) DO NOTHING;
 RETURN NEW;
END;
$function$


-- FUNCTION: public.is_owenfx_admin()
CREATE OR REPLACE FUNCTION public.is_owenfx_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT EXISTS(SELECT 1 FROM public.admin_members m WHERE m.user_id=auth.uid() AND m.active=true AND m.role IN ('owner','admin'));
$function$


-- FUNCTION: public.is_owenfx_content_editor()
CREATE OR REPLACE FUNCTION public.is_owenfx_content_editor()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT EXISTS(SELECT 1 FROM public.admin_members m WHERE m.user_id=auth.uid() AND m.active=true AND m.role IN ('owner','admin','editor'));
$function$


-- FUNCTION: public.rls_auto_enable()
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
  tbl name;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        SELECT c.relname INTO tbl FROM pg_catalog.pg_class c WHERE c.oid = cmd.objid;
        EXECUTE format('alter table if exists %I.%I enable row level security', cmd.schema_name, tbl);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$


-- FUNCTION: public.consume_api_rate_limit(text, integer, integer)
CREATE OR REPLACE FUNCTION public.consume_api_rate_limit(
  p_bucket_key text,
  p_limit integer DEFAULT 60,
  p_window_seconds integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = pg_catalog, private
AS $function$
DECLARE
  v_count integer;
  v_window_seconds integer := greatest(1, least(coalesce(p_window_seconds, 60), 86400));
  v_limit integer := greatest(1, least(coalesce(p_limit, 60), 1000));
BEGIN
  IF p_bucket_key IS NULL OR p_bucket_key !~ '^[0-9a-f]{64}$' THEN
    RETURN false;
  END IF;

  INSERT INTO private.api_rate_limits (bucket_key, window_started_at, request_count, updated_at)
  VALUES (p_bucket_key, now(), 1, now())
  ON CONFLICT (bucket_key) DO UPDATE
  SET
    window_started_at = CASE
      WHEN private.api_rate_limits.window_started_at <= now() - make_interval(secs => v_window_seconds)
      THEN now()
      ELSE private.api_rate_limits.window_started_at
    END,
    request_count = CASE
      WHEN private.api_rate_limits.window_started_at <= now() - make_interval(secs => v_window_seconds)
      THEN 1
      ELSE private.api_rate_limits.request_count + 1
    END,
    updated_at = now()
  RETURNING request_count INTO v_count;

  RETURN v_count <= v_limit;
END;
$function$;

REVOKE ALL ON FUNCTION public.consume_api_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_api_rate_limit(text, integer, integer) TO service_role;

-- POLICY: public.analytics_events."Admins read analytics events"
CREATE POLICY "Admins read analytics events" ON public.analytics_events AS PERMISSIVE FOR SELECT TO authenticated USING (is_owenfx_admin());

-- POLICY: public.api_devices."content editors manage own api devices"
CREATE POLICY "content editors manage own api devices" ON public.api_devices AS PERMISSIVE FOR ALL TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) AND is_owenfx_content_editor())) WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND is_owenfx_content_editor()));

-- POLICY: public.article_interactions."Users create own article interactions"
CREATE POLICY "Users create own article interactions" ON public.article_interactions AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((( SELECT auth.uid() AS uid) = user_id) AND (EXISTS ( SELECT 1
   FROM articles a
  WHERE ((a.id = article_interactions.article_id) AND (a.status = 'published'::text) AND (a.published_at <= now()))))));

-- POLICY: public.article_interactions."Users delete own article interactions"
CREATE POLICY "Users delete own article interactions" ON public.article_interactions AS PERMISSIVE FOR DELETE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

-- POLICY: public.article_interactions."Users read own article interactions"
CREATE POLICY "Users read own article interactions" ON public.article_interactions AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

-- POLICY: public.article_revisions."Admins manage article revisions"
CREATE POLICY "Admins manage article revisions" ON public.article_revisions AS PERMISSIVE FOR ALL TO authenticated USING (is_owenfx_admin()) WITH CHECK (is_owenfx_admin());

-- POLICY: public.article_revisions."Authors read own article revisions"
CREATE POLICY "Authors read own article revisions" ON public.article_revisions AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM articles a
  WHERE ((a.id = article_revisions.article_id) AND (a.author_id = auth.uid())))));

-- POLICY: public.article_revisions."Editors manage article revisions"
CREATE POLICY "Editors manage article revisions" ON public.article_revisions AS PERMISSIVE FOR ALL TO authenticated USING (is_owenfx_content_editor()) WITH CHECK (is_owenfx_content_editor());

-- POLICY: public.article_tags."Admins manage article tags"
CREATE POLICY "Admins manage article tags" ON public.article_tags AS PERMISSIVE FOR ALL TO authenticated USING (is_owenfx_admin()) WITH CHECK (is_owenfx_admin());

-- POLICY: public.article_tags."Editors manage article tags"
CREATE POLICY "Editors manage article tags" ON public.article_tags AS PERMISSIVE FOR ALL TO authenticated USING (is_owenfx_content_editor()) WITH CHECK (is_owenfx_content_editor());

-- POLICY: public.article_tags."Public read tags on published articles"
CREATE POLICY "Public read tags on published articles" ON public.article_tags AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM articles a
  WHERE ((a.id = article_tags.article_id) AND (a.status = 'published'::text) AND (a.published_at <= now())))));

-- POLICY: public.articles."Admins manage articles"
CREATE POLICY "Admins manage articles" ON public.articles AS PERMISSIVE FOR ALL TO authenticated USING (is_owenfx_admin()) WITH CHECK (is_owenfx_admin());

-- POLICY: public.articles."Authors read own articles"
CREATE POLICY "Authors read own articles" ON public.articles AS PERMISSIVE FOR SELECT TO authenticated USING ((author_id = auth.uid()));

-- POLICY: public.articles."Editors manage articles"
CREATE POLICY "Editors manage articles" ON public.articles AS PERMISSIVE FOR ALL TO authenticated USING (is_owenfx_content_editor()) WITH CHECK (is_owenfx_content_editor());

-- POLICY: public.articles."Public can read published articles"
CREATE POLICY "Public can read published articles" ON public.articles AS PERMISSIVE FOR SELECT TO public USING (((status = 'published'::text) AND (published_at <= now())));

-- POLICY: public.audit_logs."Admins read audit logs"
CREATE POLICY "Admins read audit logs" ON public.audit_logs AS PERMISSIVE FOR SELECT TO authenticated USING (is_owenfx_admin());

-- POLICY: public.audit_logs."Content editors append audit logs"
CREATE POLICY "Content editors append audit logs" ON public.audit_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((actor_id = auth.uid()) AND is_owenfx_content_editor()));

-- POLICY: public.categories."Admins manage categories"
CREATE POLICY "Admins manage categories" ON public.categories AS PERMISSIVE FOR ALL TO authenticated USING (is_owenfx_admin()) WITH CHECK (is_owenfx_admin());

-- POLICY: public.categories."Public can read active categories"
CREATE POLICY "Public can read active categories" ON public.categories AS PERMISSIVE FOR SELECT TO public USING ((active = true));

-- POLICY: public.comments."Admins moderate comments"
CREATE POLICY "Admins moderate comments" ON public.comments AS PERMISSIVE FOR ALL TO authenticated USING (is_owenfx_admin()) WITH CHECK (is_owenfx_admin());

-- POLICY: public.comments."Public read approved comments"
CREATE POLICY "Public read approved comments" ON public.comments AS PERMISSIVE FOR SELECT TO public USING ((status = 'approved'::text));

-- POLICY: public.comments."Users create own pending comments"
CREATE POLICY "Users create own pending comments" ON public.comments AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((author_id = auth.uid()) AND (status = 'pending'::text) AND (EXISTS ( SELECT 1
   FROM articles a
  WHERE ((a.id = comments.article_id) AND (a.status = 'published'::text))))));

-- POLICY: public.comments."Users read own comments"
CREATE POLICY "Users read own comments" ON public.comments AS PERMISSIVE FOR SELECT TO authenticated USING ((author_id = auth.uid()));

-- POLICY: public.media_assets."Admins manage media assets"
CREATE POLICY "Admins manage media assets" ON public.media_assets AS PERMISSIVE FOR ALL TO authenticated USING (is_owenfx_admin()) WITH CHECK (is_owenfx_admin());

-- POLICY: public.media_assets."Owners add own media assets"
CREATE POLICY "Owners add own media assets" ON public.media_assets AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));

-- POLICY: public.media_assets."Owners delete own media assets"
CREATE POLICY "Owners delete own media assets" ON public.media_assets AS PERMISSIVE FOR DELETE TO authenticated USING ((owner_id = ( SELECT auth.uid() AS uid)));

-- POLICY: public.media_assets."Owners read own media assets"
CREATE POLICY "Owners read own media assets" ON public.media_assets AS PERMISSIVE FOR SELECT TO authenticated USING ((owner_id = ( SELECT auth.uid() AS uid)));

-- POLICY: public.media_assets."Owners update own media assets"
CREATE POLICY "Owners update own media assets" ON public.media_assets AS PERMISSIVE FOR UPDATE TO authenticated USING ((owner_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));

-- POLICY: public.profiles."Admins manage profiles"
CREATE POLICY "Admins manage profiles" ON public.profiles AS PERMISSIVE FOR ALL TO authenticated USING (is_owenfx_admin()) WITH CHECK (is_owenfx_admin());

-- POLICY: public.profiles."Profiles are publicly readable"
CREATE POLICY "Profiles are publicly readable" ON public.profiles AS PERMISSIVE FOR SELECT TO public USING (true);

-- POLICY: public.profiles."Users insert own profile"
CREATE POLICY "Users insert own profile" ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = id));

-- POLICY: public.profiles."Users update own profile"
CREATE POLICY "Users update own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));

-- POLICY: public.site_promotions."Admins manage promotions"
CREATE POLICY "Admins manage promotions" ON public.site_promotions AS PERMISSIVE FOR ALL TO authenticated USING (is_owenfx_admin()) WITH CHECK (is_owenfx_admin());

-- POLICY: public.site_promotions."Public read active promotions"
CREATE POLICY "Public read active promotions" ON public.site_promotions AS PERMISSIVE FOR SELECT TO public USING (((active = true) AND ((starts_at IS NULL) OR (starts_at <= now())) AND ((ends_at IS NULL) OR (ends_at > now()))));

-- POLICY: public.site_settings."Admins manage settings"
CREATE POLICY "Admins manage settings" ON public.site_settings AS PERMISSIVE FOR ALL TO authenticated USING (is_owenfx_admin()) WITH CHECK (is_owenfx_admin());

-- POLICY: public.site_settings."Public read public settings"
CREATE POLICY "Public read public settings" ON public.site_settings AS PERMISSIVE FOR SELECT TO public USING ((key = ANY (ARRAY['wechat_public'::text, 'monetization_public'::text])));

-- POLICY: public.software."Admins manage software"
CREATE POLICY "Admins manage software" ON public.software AS PERMISSIVE FOR ALL TO authenticated USING (is_owenfx_admin()) WITH CHECK (is_owenfx_admin());

-- POLICY: public.software."Public can read published software"
CREATE POLICY "Public can read published software" ON public.software AS PERMISSIVE FOR SELECT TO public USING ((status = 'published'::text));

-- POLICY: public.software_download_links."Admins manage software download links"
CREATE POLICY "Admins manage software download links" ON public.software_download_links AS PERMISSIVE FOR ALL TO public USING (is_owenfx_admin()) WITH CHECK (is_owenfx_admin());

-- POLICY: public.software_download_links."Public read links for published software"
CREATE POLICY "Public read links for published software" ON public.software_download_links AS PERMISSIVE FOR SELECT TO public USING (((active = true) AND (EXISTS ( SELECT 1
   FROM software s
  WHERE ((s.id = software_download_links.software_id) AND (s.status = 'published'::text) AND ((s.published_at IS NULL) OR (s.published_at <= now())))))));

-- POLICY: public.software_tags."Admins manage software tags"
CREATE POLICY "Admins manage software tags" ON public.software_tags AS PERMISSIVE FOR ALL TO authenticated USING (is_owenfx_admin()) WITH CHECK (is_owenfx_admin());

-- POLICY: public.software_tags."Public read tags on published software"
CREATE POLICY "Public read tags on published software" ON public.software_tags AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM software s
  WHERE ((s.id = software_tags.software_id) AND (s.status = 'published'::text)))));

-- POLICY: public.software_versions."Admins manage software versions"
CREATE POLICY "Admins manage software versions" ON public.software_versions AS PERMISSIVE FOR ALL TO authenticated USING (is_owenfx_admin()) WITH CHECK (is_owenfx_admin());

-- POLICY: public.software_versions."Public read versions of published software"
CREATE POLICY "Public read versions of published software" ON public.software_versions AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM software s
  WHERE ((s.id = software_versions.software_id) AND (s.status = 'published'::text)))));

-- POLICY: public.support_settings."Admins manage support settings"
CREATE POLICY "Admins manage support settings" ON public.support_settings AS PERMISSIVE FOR ALL TO public USING (is_owenfx_admin()) WITH CHECK (is_owenfx_admin());

-- POLICY: public.support_settings."Public can read enabled support settings"
CREATE POLICY "Public can read enabled support settings" ON public.support_settings AS PERMISSIVE FOR SELECT TO public USING ((enabled = true));

-- POLICY: public.tags."Admins manage tags"
CREATE POLICY "Admins manage tags" ON public.tags AS PERMISSIVE FOR ALL TO authenticated USING (is_owenfx_admin()) WITH CHECK (is_owenfx_admin());

-- POLICY: public.tags."Public can read active tags"
CREATE POLICY "Public can read active tags" ON public.tags AS PERMISSIVE FOR SELECT TO public USING ((active = true));

-- RLS: public.admin_members
ALTER TABLE public.admin_members ENABLE ROW LEVEL SECURITY;

-- RLS: public.analytics_events
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS: public.api_devices
ALTER TABLE public.api_devices ENABLE ROW LEVEL SECURITY;

-- RLS: public.article_interactions
ALTER TABLE public.article_interactions ENABLE ROW LEVEL SECURITY;

-- RLS: public.article_revisions
ALTER TABLE public.article_revisions ENABLE ROW LEVEL SECURITY;

-- RLS: public.article_tags
ALTER TABLE public.article_tags ENABLE ROW LEVEL SECURITY;

-- RLS: public.articles
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- RLS: public.audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS: public.categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS: public.comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- RLS: public.media_assets
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- RLS: public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS: public.site_promotions
ALTER TABLE public.site_promotions ENABLE ROW LEVEL SECURITY;

-- RLS: public.site_settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- RLS: public.software
ALTER TABLE public.software ENABLE ROW LEVEL SECURITY;

-- RLS: public.software_download_links
ALTER TABLE public.software_download_links ENABLE ROW LEVEL SECURITY;

-- RLS: public.software_tags
ALTER TABLE public.software_tags ENABLE ROW LEVEL SECURITY;

-- RLS: public.software_versions
ALTER TABLE public.software_versions ENABLE ROW LEVEL SECURITY;

-- RLS: public.support_settings
ALTER TABLE public.support_settings ENABLE ROW LEVEL SECURITY;

-- RLS: public.tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- GRANT: anon.admin_members
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.admin_members TO anon;

-- GRANT: anon.analytics_events
GRANT DELETE, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.analytics_events TO anon;

-- GRANT: anon.api_devices
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.api_devices TO anon;

-- GRANT: anon.article_interactions
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.article_interactions TO anon;

-- GRANT: anon.article_revisions
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.article_revisions TO anon;

-- GRANT: anon.article_tags
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.article_tags TO anon;

-- GRANT: anon.articles
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.articles TO anon;

-- GRANT: anon.audit_logs
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.audit_logs TO anon;

-- GRANT: anon.categories
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.categories TO anon;

-- GRANT: anon.comments
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.comments TO anon;

-- GRANT: anon.media_assets
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.media_assets TO anon;

-- GRANT: anon.profiles
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.profiles TO anon;

-- GRANT: anon.site_promotions
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.site_promotions TO anon;

-- GRANT: anon.site_settings
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.site_settings TO anon;

-- GRANT: anon.software
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.software TO anon;

-- GRANT: anon.software_download_links
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.software_download_links TO anon;

-- GRANT: anon.software_tags
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.software_tags TO anon;

-- GRANT: anon.software_versions
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.software_versions TO anon;

-- GRANT: anon.support_settings
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.support_settings TO anon;

-- GRANT: anon.tags
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.tags TO anon;

-- GRANT: authenticated.admin_members
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.admin_members TO authenticated;

-- GRANT: authenticated.analytics_events
GRANT DELETE, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.analytics_events TO authenticated;

-- GRANT: authenticated.api_devices
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.api_devices TO authenticated;

-- GRANT: authenticated.article_interactions
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.article_interactions TO authenticated;

-- GRANT: authenticated.article_revisions
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.article_revisions TO authenticated;

-- GRANT: authenticated.article_tags
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.article_tags TO authenticated;

-- GRANT: authenticated.articles
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.articles TO authenticated;

-- GRANT: authenticated.audit_logs
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.audit_logs TO authenticated;

-- GRANT: authenticated.categories
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.categories TO authenticated;

-- GRANT: authenticated.comments
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.comments TO authenticated;

-- GRANT: authenticated.media_assets
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.media_assets TO authenticated;

-- GRANT: authenticated.profiles
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.profiles TO authenticated;

-- GRANT: authenticated.site_promotions
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.site_promotions TO authenticated;

-- GRANT: authenticated.site_settings
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.site_settings TO authenticated;

-- GRANT: authenticated.software
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.software TO authenticated;

-- GRANT: authenticated.software_download_links
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.software_download_links TO authenticated;

-- GRANT: authenticated.software_tags
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.software_tags TO authenticated;

-- GRANT: authenticated.software_versions
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.software_versions TO authenticated;

-- GRANT: authenticated.support_settings
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.support_settings TO authenticated;

-- GRANT: authenticated.tags
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.tags TO authenticated;

-- GRANT: service_role.admin_members
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.admin_members TO service_role;

-- GRANT: service_role.analytics_events
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.analytics_events TO service_role;

-- GRANT: service_role.api_devices
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.api_devices TO service_role;

-- GRANT: service_role.article_interactions
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.article_interactions TO service_role;

-- GRANT: service_role.article_revisions
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.article_revisions TO service_role;

-- GRANT: service_role.article_tags
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.article_tags TO service_role;

-- GRANT: service_role.articles
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.articles TO service_role;

-- GRANT: service_role.audit_logs
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.audit_logs TO service_role;

-- GRANT: service_role.categories
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.categories TO service_role;

-- GRANT: service_role.comments
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.comments TO service_role;

-- GRANT: service_role.media_assets
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.media_assets TO service_role;

-- GRANT: service_role.profiles
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.profiles TO service_role;

-- GRANT: service_role.site_promotions
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.site_promotions TO service_role;

-- GRANT: service_role.site_settings
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.site_settings TO service_role;

-- GRANT: service_role.software
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.software TO service_role;

-- GRANT: service_role.software_download_links
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.software_download_links TO service_role;

-- GRANT: service_role.software_tags
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.software_tags TO service_role;

-- GRANT: service_role.software_versions
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.software_versions TO service_role;

-- GRANT: service_role.support_settings
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.support_settings TO service_role;

-- GRANT: service_role.tags
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.tags TO service_role;

-- PLATFORM DEPENDENCY: database-wide DDL event trigger.
-- This project-owned trigger invokes public.rls_auto_enable() after DDL commands.
-- It is included as a verified dependency, although event triggers are not
-- scoped to the public schema. Review ownership and enabled state before restore.
CREATE EVENT TRIGGER ensure_rls
  ON ddl_command_end
  EXECUTE FUNCTION public.rls_auto_enable();
