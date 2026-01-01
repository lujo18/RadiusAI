export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options

  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)

  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };

  public: {
    Tables: {
      brand_settings: {
        Row: {
          aesthetic: string;

          brand_voice: string;

          content_pillars: string[];

          created_at: string;

          emoji_usage: string;

          forbidden_words: string[];

          hashtag_count: number;

          hashtag_style: string;

          hashtags: string[] | null;

          id: string;

          name: string;

          niche: string;

          preferred_words: string[];

          profile_id: string;

          target_audience: string;

          tone_of_voice: string;

          updated_at: string;
        };

        Insert: {
          aesthetic: string;

          brand_voice: string;

          content_pillars?: string[];

          created_at?: string;

          emoji_usage: string;

          forbidden_words?: string[];

          hashtag_count: number;

          hashtag_style: string;

          hashtags?: string[] | null;

          id?: string;

          name: string;

          niche: string;

          preferred_words?: string[];

          profile_id: string;

          target_audience: string;

          tone_of_voice: string;

          updated_at?: string;
        };

        Update: {
          aesthetic?: string;

          brand_voice?: string;

          content_pillars?: string[];

          created_at?: string;

          emoji_usage?: string;

          forbidden_words?: string[];

          hashtag_count?: number;

          hashtag_style?: string;

          hashtags?: string[] | null;

          id?: string;

          name?: string;

          niche?: string;

          preferred_words?: string[];

          profile_id?: string;

          target_audience?: string;

          tone_of_voice?: string;

          updated_at?: string;
        };

        Relationships: [
          {
            foreignKeyName: "brand_settings_profile_id_fkey";

            columns: ["profile_id"];

            isOneToOne: true;

            referencedRelation: "profiles";

            referencedColumns: ["id"];
          }
        ];
      };

      content_rules: {
        Row: {
          avoid_topics: string[] | null;

          body_style: string;

          created_at: string;

          cta_style: string;

          depth_level: string;

          format: string;

          hook_style: string;

          id: string;

          include_examples: boolean;

          include_statistics: boolean;

          must_include: string[] | null;

          personal_story: boolean;

          perspective: string;

          slide_count: number;

          subtopics: string[] | null;

          template_id: string;

          topic_focus: string;

          updated_at: string;
        };

        Insert: {
          avoid_topics?: string[] | null;

          body_style: string;

          created_at?: string;

          cta_style: string;

          depth_level: string;

          format: string;

          hook_style: string;

          id?: string;

          include_examples?: boolean;

          include_statistics?: boolean;

          must_include?: string[] | null;

          personal_story?: boolean;

          perspective: string;

          slide_count: number;

          subtopics?: string[] | null;

          template_id: string;

          topic_focus: string;

          updated_at?: string;
        };

        Update: {
          avoid_topics?: string[] | null;

          body_style?: string;

          created_at?: string;

          cta_style?: string;

          depth_level?: string;

          format?: string;

          hook_style?: string;

          id?: string;

          include_examples?: boolean;

          include_statistics?: boolean;

          must_include?: string[] | null;

          personal_story?: boolean;

          perspective?: string;

          slide_count?: number;

          subtopics?: string[] | null;

          template_id?: string;

          topic_focus?: string;

          updated_at?: string;
        };

        Relationships: [
          {
            foreignKeyName: "content_rules_template_id_fkey";

            columns: ["template_id"];

            isOneToOne: true;

            referencedRelation: "templates";

            referencedColumns: ["id"];
          }
        ];
      };

      layout_configs: {
        Row: {
          aspect_ratio: string;

          created_at: string;

          id: string;

          slide_count: number;

          slide_design_ids: string[];

          structure: string[];

          template_id: string;
        };

        Insert: {
          aspect_ratio: string;

          created_at?: string;

          id?: string;

          slide_count: number;

          slide_design_ids?: string[];

          structure: string[];

          template_id: string;
        };

        Update: {
          aspect_ratio?: string;

          created_at?: string;

          id?: string;

          slide_count?: number;

          slide_design_ids?: string[];

          structure?: string[];

          template_id?: string;
        };

        Relationships: [
          {
            foreignKeyName: "layout_configs_template_id_fkey";

            columns: ["template_id"];

            isOneToOne: true;

            referencedRelation: "templates";

            referencedColumns: ["id"];
          }
        ];
      };

      platform_integrations: {
        Row: {
          bio: string | null;

          created_at: string;

          followers_count: number | null;

          following_count: number | null;

          full_name: string | null;

          id: string;

          is_business_account: boolean | null;

          late_platform_id: string;

          platform: string;

          profile_id: string | null;

          profile_picture_url: string | null;

          updated_at: string;

          user_id: string;

          username: string;

          website_url: string | null;
        };

        Insert: {
          bio?: string | null;

          created_at?: string;

          followers_count?: number | null;

          following_count?: number | null;

          full_name?: string | null;

          id?: string;

          is_business_account?: boolean | null;

          late_platform_id: string;

          platform: string;

          profile_id?: string | null;

          profile_picture_url?: string | null;

          updated_at?: string;

          user_id: string;

          username: string;

          website_url?: string | null;
        };

        Update: {
          bio?: string | null;

          created_at?: string;

          followers_count?: number | null;

          following_count?: number | null;

          full_name?: string | null;

          id?: string;

          is_business_account?: boolean | null;

          late_platform_id?: string;

          platform?: string;

          profile_id?: string | null;

          profile_picture_url?: string | null;

          updated_at?: string;

          user_id?: string;

          username?: string;

          website_url?: string | null;
        };

        Relationships: [
          {
            foreignKeyName: "platform_integrations_profile_id_fkey";

            columns: ["profile_id"];

            isOneToOne: false;

            referencedRelation: "profiles";

            referencedColumns: ["id"];
          },

          {
            foreignKeyName: "platform_integrations_user_id_fkey";

            columns: ["user_id"];

            isOneToOne: false;

            referencedRelation: "users";

            referencedColumns: ["id"];
          }
        ];
      };

      post_analytics: {
        Row: {
          engagement: number;

          engagement_rate: number | null;

          id: string;

          impressions: number;

          last_updated: string | null;

          post_id: string;

          saves: number;

          shares: number;
        };

        Insert: {
          engagement?: number;

          engagement_rate?: number | null;

          id?: string;

          impressions?: number;

          last_updated?: string | null;

          post_id: string;

          saves?: number;

          shares?: number;
        };

        Update: {
          engagement?: number;

          engagement_rate?: number | null;

          id?: string;

          impressions?: number;

          last_updated?: string | null;

          post_id?: string;

          saves?: number;

          shares?: number;
        };

        Relationships: [
          {
            foreignKeyName: "post_analytics_post_id_fkey";

            columns: ["post_id"];

            isOneToOne: true;

            referencedRelation: "posts";

            referencedColumns: ["id"];
          }
        ];
      };

      post_metadata: {
        Row: {
          created_at: string;

          generation_params: Json;

          id: string;

          post_id: string;

          variant_label: string | null;
        };

        Insert: {
          created_at?: string;

          generation_params?: Json;

          id?: string;

          post_id: string;

          variant_label?: string | null;
        };

        Update: {
          created_at?: string;

          generation_params?: Json;

          id?: string;

          post_id?: string;

          variant_label?: string | null;
        };

        Relationships: [
          {
            foreignKeyName: "post_metadata_post_id_fkey";

            columns: ["post_id"];

            isOneToOne: true;

            referencedRelation: "posts";

            referencedColumns: ["id"];
          }
        ];
      };

      post_slide_text_elements: {
        Row: {
          color: string;

          content: string;

          created_at: string;

          font_family: string;

          font_size: number;

          font_style: string;

          id: string;

          post_slide_id: string;

          role: string | null;

          text_align: string;

          width: number;

          x: number;

          y: number;
        };

        Insert: {
          color: string;

          content: string;

          created_at?: string;

          font_family: string;

          font_size: number;

          font_style: string;

          id?: string;

          post_slide_id: string;

          role?: string | null;

          text_align: string;

          width: number;

          x: number;

          y: number;
        };

        Update: {
          color?: string;

          content?: string;

          created_at?: string;

          font_family?: string;

          font_size?: number;

          font_style?: string;

          id?: string;

          post_slide_id?: string;

          role?: string | null;

          text_align?: string;

          width?: number;

          x?: number;

          y?: number;
        };

        Relationships: [
          {
            foreignKeyName: "post_slide_text_elements_post_slide_id_fkey";

            columns: ["post_slide_id"];

            isOneToOne: false;

            referencedRelation: "post_slides";

            referencedColumns: ["id"];
          }
        ];
      };

      post_slides: {
        Row: {
          background: Json;

          created_at: string;

          id: string;

          image_prompt: string | null;

          post_id: string;

          slide_design_id: string | null;

          slide_number: number;
        };

        Insert: {
          background: Json;

          created_at?: string;

          id?: string;

          image_prompt?: string | null;

          post_id: string;

          slide_design_id?: string | null;

          slide_number: number;
        };

        Update: {
          background?: Json;

          created_at?: string;

          id?: string;

          image_prompt?: string | null;

          post_id?: string;

          slide_design_id?: string | null;

          slide_number?: number;
        };

        Relationships: [
          {
            foreignKeyName: "post_slides_post_id_fkey";

            columns: ["post_id"];

            isOneToOne: false;

            referencedRelation: "posts";

            referencedColumns: ["id"];
          },

          {
            foreignKeyName: "post_slides_slide_design_id_fkey";

            columns: ["slide_design_id"];

            isOneToOne: false;

            referencedRelation: "slide_designs";

            referencedColumns: ["id"];
          }
        ];
      };

      posts: {
        Row: {
          content: Json;

          created_at: string;

          id: string;

          metadata: Json | null;

          platform: string;

          profile_id: string | null;

          published_time: string | null;

          scheduled_time: string | null;

          status: string;

          storage_urls: Json;

          template_id: string | null;

          updated_at: string | null;

          user_id: string;

          variant_set_id: string | null;
        };

        Insert: {
          content: Json;

          created_at?: string;

          id?: string;

          metadata?: Json | null;

          platform: string;

          profile_id?: string | null;

          published_time?: string | null;

          scheduled_time?: string | null;

          status?: string;

          storage_urls?: Json;

          template_id?: string | null;

          updated_at?: string | null;

          user_id: string;

          variant_set_id?: string | null;
        };

        Update: {
          content?: Json;

          created_at?: string;

          id?: string;

          metadata?: Json | null;

          platform?: string;

          profile_id?: string | null;

          published_time?: string | null;

          scheduled_time?: string | null;

          status?: string;

          storage_urls?: Json;

          template_id?: string | null;

          updated_at?: string | null;

          user_id?: string;

          variant_set_id?: string | null;
        };

        Relationships: [
          {
            foreignKeyName: "posts_profile_id_fkey";

            columns: ["profile_id"];

            isOneToOne: false;

            referencedRelation: "profiles";

            referencedColumns: ["id"];
          },

          {
            foreignKeyName: "posts_template_id_fkey";

            columns: ["template_id"];

            isOneToOne: false;

            referencedRelation: "templates";

            referencedColumns: ["id"];
          },

          {
            foreignKeyName: "posts_user_id_fkey";

            columns: ["user_id"];

            isOneToOne: false;

            referencedRelation: "users";

            referencedColumns: ["id"];
          }
        ];
      };

      profiles: {
        Row: {
          brand_settings: Json;

          created_at: string;

          description: string | null;

          id: string;

          late_profile_id: string;

          post_count: number;

          template_count: number;

          updated_at: string;

          user_id: string;
        };

        Insert: {
          brand_settings: Json;

          created_at?: string;

          description?: string | null;

          id?: string;

          late_profile_id: string;

          post_count?: number;

          template_count?: number;

          updated_at?: string;

          user_id: string;
        };

        Update: {
          brand_settings?: Json;

          created_at?: string;

          description?: string | null;

          id?: string;

          late_profile_id?: string;

          post_count?: number;

          template_count?: number;

          updated_at?: string;

          user_id?: string;
        };

        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey";

            columns: ["user_id"];

            isOneToOne: false;

            referencedRelation: "users";

            referencedColumns: ["id"];
          }
        ];
      };

      slide_designs: {
        Row: {
          background: Json | null;

          created_at: string;

          dynamic: boolean;

          id: string;

          name: string;

          template_id: string;

          text_elements: Json;
        };

        Insert: {
          background?: Json | null;

          created_at?: string;

          dynamic?: boolean;

          id?: string;

          name: string;

          template_id: string;

          text_elements?: Json;
        };

        Update: {
          background?: Json | null;

          created_at?: string;

          dynamic?: boolean;

          id?: string;

          name?: string;

          template_id?: string;

          text_elements?: Json;
        };

        Relationships: [
          {
            foreignKeyName: "slide_designs_template_id_fkey";

            columns: ["template_id"];

            isOneToOne: false;

            referencedRelation: "templates";

            referencedColumns: ["id"];
          }
        ];
      };

      storage_urls: {
        Row: {
          created_at: string;

          id: string;

          post_id: string;

          slide_urls: string[];

          thumbnail: string | null;
        };

        Insert: {
          created_at?: string;

          id?: string;

          post_id: string;

          slide_urls?: string[];

          thumbnail?: string | null;
        };

        Update: {
          created_at?: string;

          id?: string;

          post_id?: string;

          slide_urls?: string[];

          thumbnail?: string | null;
        };

        Relationships: [
          {
            foreignKeyName: "storage_urls_post_id_fkey";

            columns: ["post_id"];

            isOneToOne: true;

            referencedRelation: "posts";

            referencedColumns: ["id"];
          }
        ];
      };

      template_performance: {
        Row: {
          avg_engagement_rate: number | null;

          avg_impressions: number | null;

          avg_saves: number | null;

          avg_shares: number | null;

          id: string;

          last_updated: string | null;

          template_id: string;

          total_posts: number;
        };

        Insert: {
          avg_engagement_rate?: number | null;

          avg_impressions?: number | null;

          avg_saves?: number | null;

          avg_shares?: number | null;

          id?: string;

          last_updated?: string | null;

          template_id: string;

          total_posts?: number;
        };

        Update: {
          avg_engagement_rate?: number | null;

          avg_impressions?: number | null;

          avg_saves?: number | null;

          avg_shares?: number | null;

          id?: string;

          last_updated?: string | null;

          template_id?: string;

          total_posts?: number;
        };

        Relationships: [
          {
            foreignKeyName: "template_performance_template_id_fkey";

            columns: ["template_id"];

            isOneToOne: true;

            referencedRelation: "templates";

            referencedColumns: ["id"];
          }
        ];
      };

      templates: {
        Row: {
          category: string;

          created_at: string;

          favorite: boolean;

          id: string;

          is_default: boolean;

          name: string;

          profile_id: string | null;

          status: string;

          style_config: Json;

          tags: string[] | null;

          updated_at: string;

          user_id: string;
        };

        Insert: {
          category: string;

          created_at?: string;

          favorite?: boolean;

          id?: string;

          is_default?: boolean;

          name: string;

          profile_id?: string | null;

          status?: string;

          style_config: Json;

          tags?: string[] | null;

          updated_at?: string;

          user_id: string;
        };

        Update: {
          category?: string;

          created_at?: string;

          favorite?: boolean;

          id?: string;

          is_default?: boolean;

          name?: string;

          profile_id?: string | null;

          status?: string;

          style_config?: Json;

          tags?: string[] | null;

          updated_at?: string;

          user_id?: string;
        };

        Relationships: [
          {
            foreignKeyName: "templates_profile_id_fkey";

            columns: ["profile_id"];

            isOneToOne: false;

            referencedRelation: "profiles";

            referencedColumns: ["id"];
          },

          {
            foreignKeyName: "templates_user_id_fkey";

            columns: ["user_id"];

            isOneToOne: false;

            referencedRelation: "users";

            referencedColumns: ["id"];
          }
        ];
      };

      testimonials: {
        Row: {
          avatar_url: string | null;

          company: string | null;

          created_at: string | null;

          featured: boolean | null;

          id: string;

          name: string;

          published: boolean | null;

          quote: string;

          rating: number | null;

          role: string | null;

          updated_at: string | null;
        };

        Insert: {
          avatar_url?: string | null;

          company?: string | null;

          created_at?: string | null;

          featured?: boolean | null;

          id?: string;

          name: string;

          published?: boolean | null;

          quote: string;

          rating?: number | null;

          role?: string | null;

          updated_at?: string | null;
        };

        Update: {
          avatar_url?: string | null;

          company?: string | null;

          created_at?: string | null;

          featured?: boolean | null;

          id?: string;

          name?: string;

          published?: boolean | null;

          quote?: string;

          rating?: number | null;

          role?: string | null;

          updated_at?: string | null;
        };

        Relationships: [];
      };

      users: {
        Row: {
          created_at: string;

          current_period_end: string | null;

          email: string;

          id: string;

          name: string;

          post_count: number;

          stripe_customer_id: string | null;

          stripe_subscription_id: string | null;

          subscription_plan: string | null;

          subscription_status: string | null;

          template_count: number;

          updated_at: string;
        };

        Insert: {
          created_at?: string;

          current_period_end?: string | null;

          email: string;

          id: string;

          name: string;

          post_count?: number;

          stripe_customer_id?: string | null;

          stripe_subscription_id?: string | null;

          subscription_plan?: string | null;

          subscription_status?: string | null;

          template_count?: number;

          updated_at?: string;
        };

        Update: {
          created_at?: string;

          current_period_end?: string | null;

          email?: string;

          id?: string;

          name?: string;

          post_count?: number;

          stripe_customer_id?: string | null;

          stripe_subscription_id?: string | null;

          subscription_plan?: string | null;

          subscription_status?: string | null;

          template_count?: number;

          updated_at?: string;
        };

        Relationships: [];
      };

      variant_set_stats: {
        Row: {
          avg_engagement: number;

          avg_engagement_rate: number;

          avg_impressions: number;

          avg_saves: number;

          created_at: string;

          id: string;

          template_id: string;

          total_posts: number;

          updated_at: string;

          variant_set_id: string;
        };

        Insert: {
          avg_engagement?: number;

          avg_engagement_rate?: number;

          avg_impressions?: number;

          avg_saves?: number;

          created_at?: string;

          id?: string;

          template_id: string;

          total_posts?: number;

          updated_at?: string;

          variant_set_id: string;
        };

        Update: {
          avg_engagement?: number;

          avg_engagement_rate?: number;

          avg_impressions?: number;

          avg_saves?: number;

          created_at?: string;

          id?: string;

          template_id?: string;

          total_posts?: number;

          updated_at?: string;

          variant_set_id?: string;
        };

        Relationships: [
          {
            foreignKeyName: "variant_set_stats_template_id_fkey";

            columns: ["template_id"];

            isOneToOne: false;

            referencedRelation: "templates";

            referencedColumns: ["id"];
          },

          {
            foreignKeyName: "variant_set_stats_variant_set_id_fkey";

            columns: ["variant_set_id"];

            isOneToOne: false;

            referencedRelation: "variant_sets";

            referencedColumns: ["id"];
          }
        ];
      };

      variant_set_templates: {
        Row: {
          created_at: string;

          id: string;

          template_id: string;

          variant_set_id: string;
        };

        Insert: {
          created_at?: string;

          id?: string;

          template_id: string;

          variant_set_id: string;
        };

        Update: {
          created_at?: string;

          id?: string;

          template_id?: string;

          variant_set_id?: string;
        };

        Relationships: [
          {
            foreignKeyName: "variant_set_templates_template_id_fkey";

            columns: ["template_id"];

            isOneToOne: false;

            referencedRelation: "templates";

            referencedColumns: ["id"];
          },

          {
            foreignKeyName: "variant_set_templates_variant_set_id_fkey";

            columns: ["variant_set_id"];

            isOneToOne: false;

            referencedRelation: "variant_sets";

            referencedColumns: ["id"];
          }
        ];
      };

      variant_sets: {
        Row: {
          completed_at: string | null;

          confidence_score: number | null;

          created_at: string;

          end_date: string;

          id: string;

          insights: string[] | null;

          name: string;

          posts_per_template: number;

          start_date: string;

          status: string;

          updated_at: string;

          user_id: string;

          winning_template_id: string | null;
        };

        Insert: {
          completed_at?: string | null;

          confidence_score?: number | null;

          created_at?: string;

          end_date: string;

          id?: string;

          insights?: string[] | null;

          name: string;

          posts_per_template: number;

          start_date: string;

          status: string;

          updated_at?: string;

          user_id: string;

          winning_template_id?: string | null;
        };

        Update: {
          completed_at?: string | null;

          confidence_score?: number | null;

          created_at?: string;

          end_date?: string;

          id?: string;

          insights?: string[] | null;

          name?: string;

          posts_per_template?: number;

          start_date?: string;

          status?: string;

          updated_at?: string;

          user_id?: string;

          winning_template_id?: string | null;
        };

        Relationships: [
          {
            foreignKeyName: "variant_sets_user_id_fkey";

            columns: ["user_id"];

            isOneToOne: false;

            referencedRelation: "users";

            referencedColumns: ["id"];
          },

          {
            foreignKeyName: "variant_sets_winning_template_id_fkey";

            columns: ["winning_template_id"];

            isOneToOne: false;

            referencedRelation: "templates";

            referencedColumns: ["id"];
          }
        ];
      };
    };

    Views: {
      [_ in never]: never;
    };

    Functions: {
      [_ in never]: never;
    };

    Enums: {
      [_ in never]: never;
    };

    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
