import type { GenericSchema } from '@supabase/supabase-js'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_members: {
        Row: {
          active: boolean
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          role?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          article_id: string | null
          created_at: string
          event_type: string
          id: number
          referrer_host: string | null
          software_id: string | null
          target_key: string | null
        }
        Insert: {
          article_id?: string | null
          created_at?: string
          event_type: string
          id?: never
          referrer_host?: string | null
          software_id?: string | null
          target_key?: string | null
        }
        Update: {
          article_id?: string | null
          created_at?: string
          event_type?: string
          id?: never
          referrer_host?: string | null
          software_id?: string | null
          target_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_software_id_fkey"
            columns: ["software_id"]
            isOneToOne: false
            referencedRelation: "software"
            referencedColumns: ["id"]
          },
        ]
      }
      api_devices: {
        Row: {
          active: boolean
          created_at: string
          expires_at: string | null
          id: string
          last_used_at: string | null
          name: string
          scopes: string[]
          token_hash: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          name: string
          scopes?: string[]
          token_hash: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          name?: string
          scopes?: string[]
          token_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      article_interactions: {
        Row: {
          article_id: string
          created_at: string
          id: string
          interaction_type: string
          user_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          interaction_type: string
          user_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          interaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_interactions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_revisions: {
        Row: {
          article_id: string
          content_hash: string | null
          content_json: Json | null
          content_markdown: string
          created_at: string
          editor_id: string | null
          excerpt: string
          github_path: string | null
          github_sha: string | null
          id: string
          title: string
        }
        Insert: {
          article_id: string
          content_hash?: string | null
          content_json?: Json | null
          content_markdown?: string
          created_at?: string
          editor_id?: string | null
          excerpt?: string
          github_path?: string | null
          github_sha?: string | null
          id?: string
          title: string
        }
        Update: {
          article_id?: string
          content_hash?: string | null
          content_json?: Json | null
          content_markdown?: string
          created_at?: string
          editor_id?: string | null
          excerpt?: string
          github_path?: string | null
          github_sha?: string | null
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_revisions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_tags: {
        Row: {
          article_id: string
          tag_id: string
        }
        Insert: {
          article_id: string
          tag_id: string
        }
        Update: {
          article_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_tags_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          author_id: string | null
          category_id: string | null
          content_hash: string | null
          content_json: Json | null
          content_markdown: string
          cover_url: string | null
          created_at: string
          excerpt: string
          featured: boolean
          github_path: string | null
          github_sha: string | null
          id: string
          legacy_author: string | null
          legacy_id: string | null
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content_hash?: string | null
          content_json?: Json | null
          content_markdown?: string
          cover_url?: string | null
          created_at?: string
          excerpt?: string
          featured?: boolean
          github_path?: string | null
          github_sha?: string | null
          id?: string
          legacy_author?: string | null
          legacy_id?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content_hash?: string | null
          content_json?: Json | null
          content_markdown?: string
          cover_url?: string | null
          created_at?: string
          excerpt?: string
          featured?: boolean
          github_path?: string | null
          github_sha?: string | null
          id?: string
          legacy_author?: string | null
          legacy_id?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string
          id: number
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type: string
          id?: never
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string
          id?: never
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          kind: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          kind: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      comments: {
        Row: {
          article_id: string
          author_id: string
          body: string
          created_at: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          article_id: string
          author_id: string
          body: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          article_id?: string
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_author_id_profiles_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          alt_text: string | null
          bucket: string
          byte_size: number
          created_at: string
          duration_seconds: number | null
          entity_id: string | null
          entity_type: string | null
          etag: string | null
          height: number | null
          id: string
          media_kind: string
          mime_type: string
          object_key: string
          original_filename: string | null
          owner_id: string | null
          public_url: string | null
          upload_status: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          bucket: string
          byte_size: number
          created_at?: string
          duration_seconds?: number | null
          entity_id?: string | null
          entity_type?: string | null
          etag?: string | null
          height?: number | null
          id?: string
          media_kind?: string
          mime_type: string
          object_key: string
          original_filename?: string | null
          owner_id?: string | null
          public_url?: string | null
          upload_status?: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          bucket?: string
          byte_size?: number
          created_at?: string
          duration_seconds?: number | null
          entity_id?: string | null
          entity_type?: string | null
          etag?: string | null
          height?: number | null
          id?: string
          media_kind?: string
          mime_type?: string
          object_key?: string
          original_filename?: string | null
          owner_id?: string | null
          public_url?: string | null
          upload_status?: string
          width?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_promotions: {
        Row: {
          active: boolean
          body: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          key: string
          placement: string
          starts_at: string | null
          target_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          body?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          key: string
          placement: string
          starts_at?: string | null
          target_url?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          body?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          key?: string
          placement?: string
          starts_at?: string | null
          target_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      software: {
        Row: {
          category_id: string | null
          created_at: string
          description: string
          developer: string | null
          download_url: string | null
          featured: boolean
          featured_order: number
          file_size: string | null
          id: string
          image_url: string | null
          introduction_markdown: string
          legacy_id: string | null
          official_download_url: string | null
          platform: string | null
          published_at: string | null
          screenshots: Json
          slug: string
          status: string
          title: string
          updated_at: string
          version: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string
          developer?: string | null
          download_url?: string | null
          featured?: boolean
          featured_order?: number
          file_size?: string | null
          id?: string
          image_url?: string | null
          introduction_markdown?: string
          legacy_id?: string | null
          official_download_url?: string | null
          platform?: string | null
          published_at?: string | null
          screenshots?: Json
          slug: string
          status?: string
          title: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string
          developer?: string | null
          download_url?: string | null
          featured?: boolean
          featured_order?: number
          file_size?: string | null
          id?: string
          image_url?: string | null
          introduction_markdown?: string
          legacy_id?: string | null
          official_download_url?: string | null
          platform?: string | null
          published_at?: string | null
          screenshots?: Json
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "software_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      software_download_links: {
        Row: {
          access_code: string | null
          active: boolean
          created_at: string
          id: string
          label: string
          provider: string
          share_url: string
          software_id: string
          sort_order: number
        }
        Insert: {
          access_code?: string | null
          active?: boolean
          created_at?: string
          id?: string
          label?: string
          provider: string
          share_url: string
          software_id: string
          sort_order?: number
        }
        Update: {
          access_code?: string | null
          active?: boolean
          created_at?: string
          id?: string
          label?: string
          provider?: string
          share_url?: string
          software_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "software_download_links_software_id_fkey"
            columns: ["software_id"]
            isOneToOne: false
            referencedRelation: "software"
            referencedColumns: ["id"]
          },
        ]
      }
      software_tags: {
        Row: {
          software_id: string
          tag_id: string
        }
        Insert: {
          software_id: string
          tag_id: string
        }
        Update: {
          software_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "software_tags_software_id_fkey"
            columns: ["software_id"]
            isOneToOne: false
            referencedRelation: "software"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "software_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      software_versions: {
        Row: {
          changelog: string | null
          created_at: string
          download_url: string
          file_size: string | null
          id: string
          platform: string | null
          published_at: string | null
          software_id: string
          version: string
        }
        Insert: {
          changelog?: string | null
          created_at?: string
          download_url: string
          file_size?: string | null
          id?: string
          platform?: string | null
          published_at?: string | null
          software_id: string
          version: string
        }
        Update: {
          changelog?: string | null
          created_at?: string
          download_url?: string
          file_size?: string | null
          id?: string
          platform?: string | null
          published_at?: string | null
          software_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "software_versions_software_id_fkey"
            columns: ["software_id"]
            isOneToOne: false
            referencedRelation: "software"
            referencedColumns: ["id"]
          },
        ]
      }
      support_settings: {
        Row: {
          enabled: boolean
          methods: Json
          placement: string
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          methods?: Json
          placement: string
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          methods?: Json
          placement?: string
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_owenfx_admin: { Args: never; Returns: boolean }
      is_owenfx_content_editor: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const


type Assert<T extends true> = T
// Keep the generated schema structurally compatible with the Supabase client types.
type PublicSchemaCompatibility = Assert<Database['public'] extends GenericSchema ? true : false>
