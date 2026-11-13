/**
 * OwenFX Supabase database types.
 *
 * Source of truth: production project gjzxultalptqwqmpagzj.
 * Verified against the live public schema on 2026-11-13.
 *
 * This file describes the database contract only. It does not apply schema
 * changes. Text columns constrained by CHECK constraints remain string types,
 * matching Supabase generated-type semantics (Postgres enums are separate).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Relationship<
  ForeignKeyName extends string,
  Columns extends string,
  ReferencedRelation extends string,
  ReferencedColumns extends string,
> = {
  foreignKeyName: ForeignKeyName;
  columns: [Columns];
  isOneToOne: boolean;
  referencedRelation: ReferencedRelation;
  referencedColumns: [ReferencedColumns];
};

type Table<
  Row extends Record<string, unknown>,
  RequiredInsert extends keyof Row = never,
  Relationships extends Relationship<string, string, string, string>[] = [],
> = {
  Row: Row;
  Insert: Pick<Row, RequiredInsert> & Partial<Omit<Row, RequiredInsert>>;
  Update: Partial<Row>;
  Relationships: Relationships;
};

export type Database = {
  public: {
    Tables: {
      admin_members: Table<{
        user_id: string;
        role: string;
        active: boolean;
        created_at: string;
      }, 'user_id'>;

      analytics_events: Table<{
        id: number;
        event_type: string;
        article_id: string | null;
        target_key: string | null;
        referrer_host: string | null;
        created_at: string;
        software_id: string | null;
      }, 'event_type', [
        Relationship<'analytics_events_article_id_fkey', 'article_id', 'articles', 'id'>,
        Relationship<'analytics_events_software_id_fkey', 'software_id', 'software', 'id'>,
      ]>;

      api_devices: Table<{
        id: string;
        user_id: string;
        name: string;
        token_hash: string;
        scopes: string[];
        active: boolean;
        expires_at: string | null;
        last_used_at: string | null;
        created_at: string;
      }, 'user_id' | 'name' | 'token_hash'>;

      article_interactions: Table<{
        id: string;
        user_id: string;
        article_id: string;
        interaction_type: string;
        created_at: string;
      }, 'user_id' | 'article_id' | 'interaction_type', [
        Relationship<'article_interactions_article_id_fkey', 'article_id', 'articles', 'id'>,
      ]>;

      article_revisions: Table<{
        id: string;
        article_id: string;
        editor_id: string | null;
        title: string;
        excerpt: string;
        content_markdown: string;
        content_json: Json | null;
        created_at: string;
        github_path: string | null;
        github_sha: string | null;
        content_hash: string | null;
        sync_job_id: string | null;
      }, 'article_id' | 'title'>;

      article_tags: Table<{
        article_id: string;
        tag_id: string;
      }, 'article_id' | 'tag_id', [
        Relationship<'article_tags_article_id_fkey', 'article_id', 'articles', 'id'>,
        Relationship<'article_tags_tag_id_fkey', 'tag_id', 'tags', 'id'>,
      ]>;

      articles: Table<{
        id: string;
        legacy_id: string | null;
        title: string;
        slug: string;
        excerpt: string;
        content_markdown: string;
        content_json: Json | null;
        cover_url: string | null;
        category_id: string | null;
        author_id: string | null;
        status: string;
        featured: boolean;
        seo_title: string | null;
        seo_description: string | null;
        published_at: string | null;
        created_at: string;
        updated_at: string;
        legacy_author: string | null;
        github_path: string | null;
        github_sha: string | null;
        content_hash: string | null;
        sync_job_id: string | null;
      }, 'title' | 'slug', [
        Relationship<'articles_category_id_fkey', 'category_id', 'categories', 'id'>,
      ]>;

      audit_logs: Table<{
        id: number;
        actor_id: string | null;
        action: string;
        entity_type: string;
        entity_id: string | null;
        details: Json;
        created_at: string;
      }, 'action' | 'entity_type'>;

      categories: Table<{
        id: string;
        kind: string;
        name: string;
        slug: string;
        description: string | null;
        sort_order: number;
        active: boolean;
        created_at: string;
      }, 'kind' | 'name' | 'slug'>;

      comments: Table<{
        id: string;
        article_id: string;
        author_id: string;
        body: string;
        status: string;
        created_at: string;
        updated_at: string;
        moderation_source: string | null;
        moderation_reason: string | null;
        moderation_previous_status: string | null;
        deleted_at: string | null;
        deleted_by: string | null;
      }, 'article_id' | 'author_id' | 'body', [
        Relationship<'comments_article_id_fkey', 'article_id', 'articles', 'id'>,
        Relationship<'comments_author_id_profiles_fkey', 'author_id', 'profiles', 'id'>,
      ]>;

      media_assets: Table<{
        id: string;
        owner_id: string | null;
        bucket: string;
        object_key: string;
        public_url: string | null;
        mime_type: string;
        byte_size: number;
        alt_text: string | null;
        created_at: string;
        media_kind: string;
        original_filename: string | null;
        entity_type: string | null;
        entity_id: string | null;
        upload_status: string;
        width: number | null;
        height: number | null;
        duration_seconds: number | null;
        etag: string | null;
      }, 'bucket' | 'object_key' | 'mime_type' | 'byte_size'>;

      profiles: Table<{
        id: string;
        display_name: string;
        avatar_url: string | null;
        created_at: string;
        updated_at: string;
        bio: string | null;
      }, 'id'>;

      site_promotions: Table<{
        id: string;
        key: string;
        title: string;
        target_url: string | null;
        image_url: string | null;
        body: string | null;
        placement: string;
        active: boolean;
        starts_at: string | null;
        ends_at: string | null;
        updated_at: string;
      }, 'key' | 'placement'>;

      site_settings: Table<{
        key: string;
        value: Json;
        updated_by: string | null;
        updated_at: string;
      }, 'key'>;

      software: Table<{
        id: string;
        legacy_id: string | null;
        title: string;
        slug: string;
        description: string;
        category_id: string | null;
        download_url: string | null;
        image_url: string | null;
        version: string | null;
        file_size: string | null;
        platform: string | null;
        status: string;
        featured: boolean;
        updated_at: string;
        created_at: string;
        developer: string | null;
        official_download_url: string | null;
        introduction_markdown: string;
        screenshots: Json;
        featured_order: number;
        published_at: string | null;
      }, 'title' | 'slug', [
        Relationship<'software_category_id_fkey', 'category_id', 'categories', 'id'>,
      ]>;

      software_download_links: Table<{
        id: string;
        software_id: string;
        provider: string;
        label: string;
        share_url: string;
        access_code: string | null;
        sort_order: number;
        active: boolean;
        created_at: string;
      }, 'software_id' | 'provider' | 'share_url', [
        Relationship<'software_download_links_software_id_fkey', 'software_id', 'software', 'id'>,
      ]>;

      software_link_reports: Table<{
        id: string;
        software_id: string;
        download_link_id: string | null;
        software_title: string;
        provider: string;
        share_url: string;
        reason: string;
        details: string | null;
        reporter_id: string | null;
        status: string;
        admin_note: string | null;
        created_at: string;
        updated_at: string;
      }, 'software_id' | 'software_title' | 'provider' | 'share_url' | 'reason', [
        Relationship<'software_link_reports_software_id_fkey', 'software_id', 'software', 'id'>,
        Relationship<'software_link_reports_download_link_id_fkey', 'download_link_id', 'software_download_links', 'id'>,
      ]>;

      software_tags: Table<{
        software_id: string;
        tag_id: string;
      }, 'software_id' | 'tag_id', [
        Relationship<'software_tags_software_id_fkey', 'software_id', 'software', 'id'>,
        Relationship<'software_tags_tag_id_fkey', 'tag_id', 'tags', 'id'>,
      ]>;

      software_versions: Table<{
        id: string;
        software_id: string;
        version: string;
        platform: string | null;
        download_url: string;
        file_size: string | null;
        changelog: string | null;
        published_at: string | null;
        created_at: string;
      }, 'software_id' | 'version' | 'download_url', [
        Relationship<'software_versions_software_id_fkey', 'software_id', 'software', 'id'>,
      ]>;

      support_settings: Table<{
        placement: string;
        enabled: boolean;
        methods: Json;
        updated_at: string;
      }, 'placement'>;

      tags: Table<{
        id: string;
        name: string;
        slug: string;
        active: boolean;
        created_at: string;
      }, 'name' | 'slug'>;
    };

    Views: Record<never, never>;

    Functions: {
      is_owenfx_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_owenfx_content_editor: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      consume_api_rate_limit: {
        Args: { p_bucket_key: string; p_limit?: number; p_window_seconds?: number };
        Returns: boolean;
      };
      create_article_sync_job: { Args: { p_id: string; p_idempotency_key: string; p_operation: string; p_article_id: string | null; p_actor_id: string | null; p_target_path: string; p_content_hash: string; p_metadata: Json }; Returns: Json };
      get_article_sync_job: { Args: { p_id: string }; Returns: Json };
      list_article_sync_jobs: { Args: { p_limit?: number; p_state?: string | null }; Returns: Json };
      claim_article_sync_job: { Args: { p_id: string; p_lease_token: string; p_lease_seconds?: number }; Returns: Json };
      update_article_sync_job: { Args: { p_id: string; p_state: string; p_github_sha: string | null; p_last_error: string | null; p_article_id: string | null; p_lease_token: string }; Returns: boolean };
      acquire_article_sync_lock: { Args: { p_article_id: string; p_job_id: string; p_lease_token: string; p_lease_seconds?: number }; Returns: boolean };
      release_article_sync_lock: { Args: { p_article_id: string; p_job_id: string; p_lease_token: string }; Returns: boolean };
    };

    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
