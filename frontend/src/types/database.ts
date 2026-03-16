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
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      app_banners: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          location: Database["public"]["Enums"]["app_banner_location"]
          message: string
          type: Database["public"]["Enums"]["app_banner_status"] | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          location: Database["public"]["Enums"]["app_banner_location"]
          message: string
          type?: Database["public"]["Enums"]["app_banner_status"] | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          location?: Database["public"]["Enums"]["app_banner_location"]
          message?: string
          type?: Database["public"]["Enums"]["app_banner_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      automation_runs: {
        Row: {
          automation_id: string
          created_at: string | null
          cta_id_used: string | null
          error_message: string | null
          id: string
          platforms_used: string[] | null
          post_created: string | null
          run_finished_at: string | null
          run_started_at: string
          status: string
          template_id_used: string | null
        }
        Insert: {
          automation_id: string
          created_at?: string | null
          cta_id_used?: string | null
          error_message?: string | null
          id?: string
          platforms_used?: string[] | null
          post_created?: string | null
          run_finished_at?: string | null
          run_started_at?: string
          status: string
          template_id_used?: string | null
        }
        Update: {
          automation_id?: string
          created_at?: string | null
          cta_id_used?: string | null
          error_message?: string | null
          id?: string
          platforms_used?: string[] | null
          post_created?: string | null
          run_finished_at?: string | null
          run_started_at?: string
          status?: string
          template_id_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          brand_id: string
          created_at: string | null
          cta_ids: string[]
          cursor_cta_index: number | null
          cursor_template_index: number | null
          description: string | null
          error_count: number | null
          id: string
          is_active: boolean | null
          last_error: string | null
          last_run_at: string | null
          name: string
          next_run_at: string
          platforms: string[]
          post_as_draft: boolean | null
          post_automatically: boolean | null
          schedule: Json
          template_ids: string[]
          updated_at: string | null
          user_timezone: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string | null
          cta_ids: string[]
          cursor_cta_index?: number | null
          cursor_template_index?: number | null
          description?: string | null
          error_count?: number | null
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_run_at?: string | null
          name: string
          next_run_at: string
          platforms: string[]
          post_as_draft?: boolean | null
          post_automatically?: boolean | null
          schedule: Json
          template_ids: string[]
          updated_at?: string | null
          user_timezone?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string | null
          cta_ids?: string[]
          cursor_cta_index?: number | null
          cursor_template_index?: number | null
          description?: string | null
          error_count?: number | null
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_run_at?: string | null
          name?: string
          next_run_at?: string
          platforms?: string[]
          post_as_draft?: boolean | null
          post_automatically?: boolean | null
          schedule?: Json
          template_ids?: string[]
          updated_at?: string | null
          user_timezone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brand"
            referencedColumns: ["id"]
          },
        ]
      }
      brand: {
        Row: {
          brand_settings: Json
          created_at: string
          cta_settings: Json | null
          description: string | null
          id: string
          late_profile_id: string
          post_count: number
          team_id: string | null
          template_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_settings: Json
          created_at?: string
          cta_settings?: Json | null
          description?: string | null
          id?: string
          late_profile_id: string
          post_count?: number
          team_id?: string | null
          template_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_settings?: Json
          created_at?: string
          cta_settings?: Json | null
          description?: string | null
          id?: string
          late_profile_id?: string
          post_count?: number
          team_id?: string | null
          template_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_ctas: {
        Row: {
          brand_id: string
          category: string | null
          created_at: string | null
          cta_text: string
          cta_url: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          label: string
          metadata: Json | null
          updated_at: string | null
        }
        Insert: {
          brand_id: string
          category?: string | null
          created_at?: string | null
          cta_text: string
          cta_url?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          label: string
          metadata?: Json | null
          updated_at?: string | null
        }
        Update: {
          brand_id?: string
          category?: string | null
          created_at?: string | null
          cta_text?: string
          cta_url?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          label?: string
          metadata?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ctas_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brand"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: number
          reciever_id: string
          resolved: boolean | null
          sender_id: string
          type: Database["public"]["Enums"]["message_types"] | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: number
          reciever_id: string
          resolved?: boolean | null
          sender_id: string
          type?: Database["public"]["Enums"]["message_types"] | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
          reciever_id?: string
          resolved?: boolean | null
          sender_id?: string
          type?: Database["public"]["Enums"]["message_types"] | null
        }
        Relationships: [
          {
            foreignKeyName: "Messages_reciever_id_fkey"
            columns: ["reciever_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_integrations: {
        Row: {
          bio: string | null
          brand_id: string
          created_at: string
          followers_count: number | null
          following_count: number | null
          full_name: string | null
          id: string
          is_business_account: boolean | null
          pfm_account_id: string | null
          platform: string
          profile_picture_url: string | null
          status: Database["public"]["Enums"]["integration_status"]
          tiktok_access_token: string | null
          tiktok_open_id: string | null
          tiktok_refresh_expires_at: string | null
          tiktok_refresh_token: string | null
          tiktok_token_expires_at: string | null
          updated_at: string
          user_id: string | null
          username: string
          website_url: string | null
        }
        Insert: {
          bio?: string | null
          brand_id: string
          created_at?: string
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id?: string
          is_business_account?: boolean | null
          pfm_account_id?: string | null
          platform: string
          profile_picture_url?: string | null
          status?: Database["public"]["Enums"]["integration_status"]
          tiktok_access_token?: string | null
          tiktok_open_id?: string | null
          tiktok_refresh_expires_at?: string | null
          tiktok_refresh_token?: string | null
          tiktok_token_expires_at?: string | null
          updated_at?: string
          user_id?: string | null
          username: string
          website_url?: string | null
        }
        Update: {
          bio?: string | null
          brand_id?: string
          created_at?: string
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id?: string
          is_business_account?: boolean | null
          pfm_account_id?: string | null
          platform?: string
          profile_picture_url?: string | null
          status?: Database["public"]["Enums"]["integration_status"]
          tiktok_access_token?: string | null
          tiktok_open_id?: string | null
          tiktok_refresh_expires_at?: string | null
          tiktok_refresh_token?: string | null
          tiktok_token_expires_at?: string | null
          updated_at?: string
          user_id?: string | null
          username?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_integrations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brand"
            referencedColumns: ["id"]
          },
        ]
      }
      post_analytics: {
        Row: {
          average_time_watched: number | null
          brand_id: string | null
          collected_at: string | null
          collection_count: number | null
          comments: number | null
          current_interval: string | null
          engagement_rate: number | null
          id: string
          impressions: number
          last_updated: string | null
          likes: number
          new_followers: number | null
          platform: string | null
          post_id: string
          saves: number
          shares: number
          total_time_watched: number | null
        }
        Insert: {
          average_time_watched?: number | null
          brand_id?: string | null
          collected_at?: string | null
          collection_count?: number | null
          comments?: number | null
          current_interval?: string | null
          engagement_rate?: number | null
          id?: string
          impressions?: number
          last_updated?: string | null
          likes?: number
          new_followers?: number | null
          platform?: string | null
          post_id: string
          saves?: number
          shares?: number
          total_time_watched?: number | null
        }
        Update: {
          average_time_watched?: number | null
          brand_id?: string | null
          collected_at?: string | null
          collection_count?: number | null
          comments?: number | null
          current_interval?: string | null
          engagement_rate?: number | null
          id?: string
          impressions?: number
          last_updated?: string | null
          likes?: number
          new_followers?: number | null
          platform?: string | null
          post_id?: string
          saves?: number
          shares?: number
          total_time_watched?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_analytics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_analytics_history: {
        Row: {
          average_time_watched: number | null
          collected_at: string
          collection_count: number | null
          comments: number | null
          current_interval: string | null
          engagement_rate: number | null
          id: string
          impressions: number | null
          likes: number | null
          new_followers: number | null
          platform_id: string | null
          post_id: string
          raw_payload: Json | null
          saves: number | null
          shares: number | null
          total_time_watched: number | null
        }
        Insert: {
          average_time_watched?: number | null
          collected_at?: string
          collection_count?: number | null
          comments?: number | null
          current_interval?: string | null
          engagement_rate?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          new_followers?: number | null
          platform_id?: string | null
          post_id: string
          raw_payload?: Json | null
          saves?: number | null
          shares?: number | null
          total_time_watched?: number | null
        }
        Update: {
          average_time_watched?: number | null
          collected_at?: string
          collection_count?: number | null
          comments?: number | null
          current_interval?: string | null
          engagement_rate?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          new_followers?: number | null
          platform_id?: string | null
          post_id?: string
          raw_payload?: Json | null
          saves?: number | null
          shares?: number | null
          total_time_watched?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_analytics_history_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_tracking_metadata: {
        Row: {
          collection_count: number
          current_interval: Database["public"]["Enums"]["post_tracking_interval"]
          last_collected_at: string | null
          next_collection_at: string
          post_id: string
        }
        Insert: {
          collection_count?: number
          current_interval: Database["public"]["Enums"]["post_tracking_interval"]
          last_collected_at?: string | null
          next_collection_at: string
          post_id: string
        }
        Update: {
          collection_count?: number
          current_interval?: Database["public"]["Enums"]["post_tracking_interval"]
          last_collected_at?: string | null
          next_collection_at?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_tracking_metadata_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          analytics_last_sync: string | null
          automation_id: string | null
          brand_id: string | null
          content: Json
          created_at: string
          error_message: string | null
          external_permalink: string | null
          external_post_id: string | null
          generation_prompt: string | null
          id: string
          metadata: Json | null
          platform: string
          platform_captions: Json | null
          platform_ids: string[] | null
          published_time: string | null
          scheduled_time: string | null
          status: Database["public"]["Enums"]["post_status"] | null
          storage_urls: Json
          template_id: string | null
          updated_at: string | null
          variant_set_id: string | null
        }
        Insert: {
          analytics_last_sync?: string | null
          automation_id?: string | null
          brand_id?: string | null
          content: Json
          created_at?: string
          error_message?: string | null
          external_permalink?: string | null
          external_post_id?: string | null
          generation_prompt?: string | null
          id?: string
          metadata?: Json | null
          platform: string
          platform_captions?: Json | null
          platform_ids?: string[] | null
          published_time?: string | null
          scheduled_time?: string | null
          status?: Database["public"]["Enums"]["post_status"] | null
          storage_urls?: Json
          template_id?: string | null
          updated_at?: string | null
          variant_set_id?: string | null
        }
        Update: {
          analytics_last_sync?: string | null
          automation_id?: string | null
          brand_id?: string | null
          content?: Json
          created_at?: string
          error_message?: string | null
          external_permalink?: string | null
          external_post_id?: string | null
          generation_prompt?: string | null
          id?: string
          metadata?: Json | null
          platform?: string
          platform_captions?: Json | null
          platform_ids?: string[] | null
          published_time?: string | null
          scheduled_time?: string | null
          status?: Database["public"]["Enums"]["post_status"] | null
          storage_urls?: Json
          template_id?: string | null
          updated_at?: string | null
          variant_set_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brand"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      preset_images: {
        Row: {
          aesthetic_score: number | null
          color_palette: string
          composition: string
          created_at: string | null
          id: string
          objects: string[] | null
          pack_id: string | null
          storage_path: string
          tags: string[] | null
          updated_at: string | null
          url: string
          vibe: string
        }
        Insert: {
          aesthetic_score?: number | null
          color_palette: string
          composition: string
          created_at?: string | null
          id?: string
          objects?: string[] | null
          pack_id?: string | null
          storage_path: string
          tags?: string[] | null
          updated_at?: string | null
          url: string
          vibe: string
        }
        Update: {
          aesthetic_score?: number | null
          color_palette?: string
          composition?: string
          created_at?: string | null
          id?: string
          objects?: string[] | null
          pack_id?: string | null
          storage_path?: string
          tags?: string[] | null
          updated_at?: string | null
          url?: string
          vibe?: string
        }
        Relationships: [
          {
            foreignKeyName: "preset_images_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "preset_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      preset_packs: {
        Row: {
          accessibility: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          number_of_images: number | null
          team_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accessibility: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          number_of_images?: number | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accessibility?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          number_of_images?: number | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "preset_packs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      product_rate_limits: {
        Row: {
          product_id: string
          rules: Json | null
          updated_at: string | null
        }
        Insert: {
          product_id: string
          rules?: Json | null
          updated_at?: string | null
        }
        Update: {
          product_id?: string
          rules?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_templates: {
        Row: {
          category: string
          created_at: string
          favorite: boolean
          featured: boolean | null
          id: string
          is_experimental: boolean | null
          name: string
          recommended: boolean | null
          style_config: Json
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          favorite?: boolean
          featured?: boolean | null
          id?: string
          is_experimental?: boolean | null
          name: string
          recommended?: boolean | null
          style_config: Json
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          favorite?: boolean
          featured?: boolean | null
          id?: string
          is_experimental?: boolean | null
          name?: string
          recommended?: boolean | null
          style_config?: Json
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      team_activity: {
        Row: {
          id: number
          period_end: string | null
          period_start: string | null
          team_id: string | null
          updated_at: string | null
          usage: Json | null
        }
        Insert: {
          id?: number
          period_end?: string | null
          period_start?: string | null
          team_id?: string | null
          updated_at?: string | null
          usage?: Json | null
        }
        Update: {
          id?: number
          period_end?: string | null
          period_start?: string | null
          team_id?: string | null
          updated_at?: string | null
          usage?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "team_activity_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_events: {
        Row: {
          actor_id: string | null
          created_at: string | null
          event_type: string
          id: string
          payload: Json | null
          team_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          team_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          id: string
          invited_at: string | null
          invited_by: string | null
          role: string
          status: string
          team_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: string
          status?: string
          team_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: string
          status?: string
          team_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          is_public: boolean
          metadata: Json | null
          name: string
          owner_id: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          metadata?: Json | null
          name: string
          owner_id: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          metadata?: Json | null
          name?: string
          owner_id?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      templates: {
        Row: {
          brand_id: string | null
          category: string
          content_rules: Json
          created_at: string
          favorite: boolean
          id: string
          is_default: boolean
          name: string
          parent_id: string | null
          status: string
          style_config: Json | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          brand_id?: string | null
          category: string
          content_rules: Json
          created_at?: string
          favorite?: boolean
          id?: string
          is_default?: boolean
          name: string
          parent_id?: string | null
          status?: string
          style_config?: Json | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          brand_id?: string | null
          category?: string
          content_rules?: Json
          created_at?: string
          favorite?: boolean
          id?: string
          is_default?: boolean
          name?: string
          parent_id?: string | null
          status?: string
          style_config?: Json | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brand"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string | null
          featured: boolean | null
          id: string
          name: string
          published: boolean | null
          quote: string
          rating: number | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          featured?: boolean | null
          id?: string
          name: string
          published?: boolean | null
          quote: string
          rating?: number | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          featured?: boolean | null
          id?: string
          name?: string
          published?: boolean | null
          quote?: string
          rating?: number | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          current_period_end: string | null
          email: string
          id: string
          is_active: boolean | null
          is_admin: boolean
          name: string
          stripe_customer_id: string | null
          stripe_product_id: string | null
          stripe_subscription_id: string | null
          subscription_plan: string | null
          subscription_status: string | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          email: string
          id: string
          is_active?: boolean | null
          is_admin?: boolean
          name: string
          stripe_customer_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          is_admin?: boolean
          name?: string
          stripe_customer_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      variant_set_stats: {
        Row: {
          avg_engagement: number
          avg_engagement_rate: number
          avg_impressions: number
          avg_saves: number
          created_at: string
          id: string
          template_id: string
          total_posts: number
          updated_at: string
          variant_set_id: string
        }
        Insert: {
          avg_engagement?: number
          avg_engagement_rate?: number
          avg_impressions?: number
          avg_saves?: number
          created_at?: string
          id?: string
          template_id: string
          total_posts?: number
          updated_at?: string
          variant_set_id: string
        }
        Update: {
          avg_engagement?: number
          avg_engagement_rate?: number
          avg_impressions?: number
          avg_saves?: number
          created_at?: string
          id?: string
          template_id?: string
          total_posts?: number
          updated_at?: string
          variant_set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_set_stats_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_set_stats_variant_set_id_fkey"
            columns: ["variant_set_id"]
            isOneToOne: false
            referencedRelation: "variant_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      variant_set_templates: {
        Row: {
          created_at: string
          id: string
          template_id: string
          variant_set_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          template_id: string
          variant_set_id: string
        }
        Update: {
          created_at?: string
          id?: string
          template_id?: string
          variant_set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_set_templates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_set_templates_variant_set_id_fkey"
            columns: ["variant_set_id"]
            isOneToOne: false
            referencedRelation: "variant_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      variant_sets: {
        Row: {
          completed_at: string | null
          confidence_score: number | null
          created_at: string
          end_date: string
          id: string
          insights: string[] | null
          name: string
          posts_per_template: number
          start_date: string
          status: string
          team_id: string | null
          updated_at: string
          user_id: string
          winning_template_id: string | null
        }
        Insert: {
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string
          end_date: string
          id?: string
          insights?: string[] | null
          name: string
          posts_per_template: number
          start_date: string
          status: string
          team_id?: string | null
          updated_at?: string
          user_id: string
          winning_template_id?: string | null
        }
        Update: {
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string
          end_date?: string
          id?: string
          insights?: string[] | null
          name?: string
          posts_per_template?: number
          start_date?: string
          status?: string
          team_id?: string | null
          updated_at?: string
          user_id?: string
          winning_template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "variant_sets_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_sets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_sets_winning_template_id_fkey"
            columns: ["winning_template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_processed_analytics: {
        Args: {
          p_brand_id?: string
          p_mode?: string
          p_post_id?: string
          p_range?: string
          p_section?: string
          p_timezone?: string
          p_window_limit?: number
        }
        Returns: {
          collected_at: string
          comments: number
          engagement_rate: number
          impressions: number
          likes: number
          saves: number
          shares: number
        }[]
      }
      get_template_counts_by_team: {
        Args: { team_id: string }
        Returns: {
          brand_id: string
          template_count: number
        }[]
      }
      increment_usage_rpc: {
        Args: {
          p_amount: number
          p_event_id?: string
          p_metric: string
          p_period_end?: string
          p_period_start?: string
          p_user_id: string
        }
        Returns: {
          id: number
          period_end: string
          period_start: string
          updated_at: string
          usage: Json
          user_id: string
        }[]
      }
    }
    Enums: {
      app_banner_location: "(marketing)" | "(app)"
      app_banner_status: "info" | "warning" | "deal" | "maintenance"
      integration_status: "connected" | "disconnected"
      message_types: "standard" | "error" | "idea"
      post_status:
        | "draft"
        | "ready_to_review"
        | "scheduled"
        | "posting"
        | "posted"
        | "failed"
        | "deleted"
        | "archived"
      post_tracking_interval: "hourly" | "daily" | "weekly" | "monthly"
      team_member_role: "owner" | "admin" | "member" | "viewer"
      team_member_status: "active" | "pending" | "invited" | "removed"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_banner_location: ["(marketing)", "(app)"],
      app_banner_status: ["info", "warning", "deal", "maintenance"],
      integration_status: ["connected", "disconnected"],
      message_types: ["standard", "error", "idea"],
      post_status: [
        "draft",
        "ready_to_review",
        "scheduled",
        "posting",
        "posted",
        "failed",
        "deleted",
        "archived",
      ],
      post_tracking_interval: ["hourly", "daily", "weekly", "monthly"],
      team_member_role: ["owner", "admin", "member", "viewer"],
      team_member_status: ["active", "pending", "invited", "removed"],
    },
  },
} as const
