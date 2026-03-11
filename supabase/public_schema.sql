-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
CREATE TABLE public.brand_settings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  niche text NOT NULL,
  aesthetic text NOT NULL,
  target_audience text NOT NULL,
  brand_voice text NOT NULL,
  content_pillars ARRAY NOT NULL DEFAULT '{}'::text [],
  tone_of_voice text NOT NULL CHECK (
    tone_of_voice = ANY (
      ARRAY ['casual'::text, 'professional'::text, 'humorous'::text, 'edgy'::text, 'inspirational'::text]
    )
  ),
  emoji_usage text NOT NULL CHECK (
    emoji_usage = ANY (
      ARRAY ['none'::text, 'minimal'::text, 'moderate'::text, 'heavy'::text]
    )
  ),
  forbidden_words ARRAY NOT NULL DEFAULT '{}'::text [],
  preferred_words ARRAY NOT NULL DEFAULT '{}'::text [],
  hashtag_style text NOT NULL CHECK (
    hashtag_style = ANY (
      ARRAY ['niche'::text, 'trending'::text, 'mixed'::text]
    )
  ),
  hashtag_count integer NOT NULL CHECK (
    hashtag_count >= 5
    AND hashtag_count <= 30
  ),
  hashtags ARRAY DEFAULT '{}'::text [],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT brand_settings_pkey PRIMARY KEY (id),
  CONSTRAINT brand_settings_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.content_rules (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  template_id uuid NOT NULL UNIQUE,
  format text NOT NULL,
  slide_count integer NOT NULL,
  perspective text NOT NULL,
  depth_level text NOT NULL CHECK (
    depth_level = ANY (
      ARRAY ['surface'::text, 'detailed'::text, 'comprehensive'::text]
    )
  ),
  topic_focus text NOT NULL,
  subtopics ARRAY DEFAULT '{}'::text [],
  hook_style text NOT NULL,
  body_style text NOT NULL,
  cta_style text NOT NULL,
  include_examples boolean NOT NULL DEFAULT false,
  include_statistics boolean NOT NULL DEFAULT false,
  personal_story boolean NOT NULL DEFAULT false,
  avoid_topics ARRAY DEFAULT '{}'::text [],
  must_include ARRAY DEFAULT '{}'::text [],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT content_rules_pkey PRIMARY KEY (id),
  CONSTRAINT content_rules_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id)
);
CREATE TABLE public.layout_configs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  template_id uuid NOT NULL UNIQUE,
  slide_count integer NOT NULL CHECK (
    slide_count >= 3
    AND slide_count <= 15
  ),
  aspect_ratio text NOT NULL CHECK (
    aspect_ratio = ANY (
      ARRAY ['1:1'::text, '4:5'::text, '3:4'::text, '9:16'::text]
    )
  ),
  structure ARRAY NOT NULL,
  slide_design_ids ARRAY NOT NULL DEFAULT '{}'::uuid [],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT layout_configs_pkey PRIMARY KEY (id),
  CONSTRAINT layout_configs_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id)
);
CREATE TABLE public.platform_integrations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL,
  user_id uuid,
  platform text NOT NULL,
  username text NOT NULL,
  full_name text,
  profile_picture_url text,
  followers_count integer DEFAULT 0,
  following_count integer DEFAULT 0,
  bio text,
  website_url text,
  is_business_account boolean DEFAULT false,
  status text NOT NULL DEFAULT 'connected',
  pfm_account_id text,
  tiktok_open_id text,
  tiktok_access_token text,
  tiktok_refresh_token text,
  tiktok_token_expires_at timestamp with time zone,
  tiktok_refresh_expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT platform_integrations_pkey PRIMARY KEY (id),
  CONSTRAINT platform_integrations_brand_id_platform_key UNIQUE (brand_id, platform),
  CONSTRAINT platform_integrations_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brand(id),
  CONSTRAINT platform_integrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.post_analytics (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  post_id uuid NOT NULL UNIQUE,
  impressions integer NOT NULL DEFAULT 0,
  engagement integer NOT NULL DEFAULT 0,
  saves integer NOT NULL DEFAULT 0,
  shares integer NOT NULL DEFAULT 0,
  engagement_rate numeric DEFAULT 0,
  last_updated timestamp with time zone,
  CONSTRAINT post_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT post_analytics_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id)
);
CREATE TABLE public.post_metadata (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  post_id uuid NOT NULL UNIQUE,
  variant_label text,
  generation_params jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT post_metadata_pkey PRIMARY KEY (id),
  CONSTRAINT post_metadata_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id)
);
CREATE TABLE public.post_slide_text_elements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  post_slide_id uuid NOT NULL,
  content text NOT NULL,
  role text,
  font_size integer NOT NULL,
  font_family text NOT NULL,
  font_style text NOT NULL CHECK (
    font_style = ANY (
      ARRAY ['normal'::text, 'bold'::text, 'italic'::text]
    )
  ),
  color text NOT NULL,
  text_align text NOT NULL CHECK (
    text_align = ANY (
      ARRAY ['left'::text, 'center'::text, 'right'::text]
    )
  ),
  x integer NOT NULL,
  y integer NOT NULL,
  width integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT post_slide_text_elements_pkey PRIMARY KEY (id),
  CONSTRAINT post_slide_text_elements_post_slide_id_fkey FOREIGN KEY (post_slide_id) REFERENCES public.post_slides(id)
);
CREATE TABLE public.post_slides (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  post_id uuid NOT NULL,
  slide_design_id uuid,
  slide_number integer NOT NULL,
  background_type text NOT NULL CHECK (
    background_type = ANY (
      ARRAY ['solid'::text, 'gradient'::text, 'image'::text]
    )
  ),
  background_color text,
  background_gradient_colors ARRAY,
  background_gradient_angle integer,
  background_image_url text,
  image_prompt text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT post_slides_pkey PRIMARY KEY (id),
  CONSTRAINT post_slides_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT post_slides_slide_design_id_fkey FOREIGN KEY (slide_design_id) REFERENCES public.slide_designs(id)
);
CREATE TABLE public.posts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  template_id uuid,
  profile_id uuid,
  variant_set_id uuid,
  platform text NOT NULL CHECK (
    platform = ANY (ARRAY ['instagram'::text, 'tiktok'::text])
  ),
  status text NOT NULL DEFAULT 'draft'::text CHECK (
    status = ANY (
      ARRAY ['draft'::text, 'scheduled'::text, 'publishing'::text, 'published'::text, 'failed'::text]
    )
  ),
  content jsonb NOT NULL,
  storage_urls jsonb NOT NULL DEFAULT '{"slides": [], "thumbnail": null}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone,
  scheduled_time timestamp with time zone,
  published_time timestamp with time zone,
  CONSTRAINT posts_pkey PRIMARY KEY (id),
  CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT posts_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id),
  CONSTRAINT posts_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  brand_settings jsonb NOT NULL,
  template_count integer NOT NULL DEFAULT 0,
  post_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  late_profile_id text NOT NULL,
  description text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.slide_designs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  template_id uuid NOT NULL,
  name text NOT NULL,
  dynamic boolean NOT NULL DEFAULT false,
  background_type text NOT NULL CHECK (
    background_type = ANY (
      ARRAY ['solid'::text, 'gradient'::text, 'image'::text]
    )
  ),
  background_color text,
  background_gradient_colors ARRAY,
  background_gradient_angle integer,
  background_image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT slide_designs_pkey PRIMARY KEY (id),
  CONSTRAINT slide_designs_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id)
);
CREATE TABLE public.storage_urls (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  post_id uuid NOT NULL UNIQUE,
  thumbnail text,
  slide_urls ARRAY NOT NULL DEFAULT '{}'::text [],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT storage_urls_pkey PRIMARY KEY (id),
  CONSTRAINT storage_urls_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id)
);
CREATE TABLE public.template_performance (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  template_id uuid NOT NULL UNIQUE,
  total_posts integer NOT NULL DEFAULT 0,
  avg_engagement_rate numeric DEFAULT 0,
  avg_saves integer DEFAULT 0,
  avg_shares integer DEFAULT 0,
  avg_impressions integer DEFAULT 0,
  last_updated timestamp with time zone,
  CONSTRAINT template_performance_pkey PRIMARY KEY (id),
  CONSTRAINT template_performance_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id)
);
CREATE TABLE public.templates (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  profile_id uuid,
  name text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  category text NOT NULL CHECK (
    category = ANY (
      ARRAY ['listicle'::text, 'quote'::text, 'story'::text, 'educational'::text, 'comparison'::text, 'custom'::text]
    )
  ),
  status text NOT NULL DEFAULT 'active'::text CHECK (
    status = ANY (
      ARRAY ['active'::text, 'archived'::text, 'testing'::text]
    )
  ),
  style_config jsonb NOT NULL,
  tags ARRAY DEFAULT '{}'::text [],
  favorite boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT templates_pkey PRIMARY KEY (id),
  CONSTRAINT templates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT templates_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.testimonials (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  role text,
  company text,
  quote text NOT NULL,
  avatar_url text,
  rating integer CHECK (
    rating >= 1
    AND rating <= 5
  ),
  published boolean DEFAULT false,
  featured boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT testimonials_pkey PRIMARY KEY (id)
);
CREATE TABLE public.text_elements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  slide_design_id uuid NOT NULL,
  content text NOT NULL,
  role text,
  font_size integer NOT NULL,
  font_family text NOT NULL,
  font_style text NOT NULL CHECK (
    font_style = ANY (
      ARRAY ['normal'::text, 'bold'::text, 'italic'::text]
    )
  ),
  color text NOT NULL,
  text_align text NOT NULL CHECK (
    text_align = ANY (
      ARRAY ['left'::text, 'center'::text, 'right'::text]
    )
  ),
  x integer NOT NULL,
  y integer NOT NULL,
  width integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT text_elements_pkey PRIMARY KEY (id),
  CONSTRAINT text_elements_slide_design_id_fkey FOREIGN KEY (slide_design_id) REFERENCES public.slide_designs(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  subscription_plan text CHECK (
    subscription_plan = ANY (
      ARRAY ['starter'::text, 'growth'::text, 'unlimited'::text]
    )
  ),
  template_count integer NOT NULL DEFAULT 0,
  post_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  stripe_subscription_id text,
  stripe_customer_id text,
  subscription_status text,
  current_period_end timestamp with time zone,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.variant_set_stats (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  variant_set_id uuid NOT NULL,
  template_id uuid NOT NULL,
  avg_saves numeric NOT NULL DEFAULT 0,
  avg_engagement numeric NOT NULL DEFAULT 0,
  avg_impressions integer NOT NULL DEFAULT 0,
  avg_engagement_rate numeric NOT NULL DEFAULT 0,
  total_posts integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT variant_set_stats_pkey PRIMARY KEY (id),
  CONSTRAINT variant_set_stats_variant_set_id_fkey FOREIGN KEY (variant_set_id) REFERENCES public.variant_sets(id),
  CONSTRAINT variant_set_stats_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id)
);
CREATE TABLE public.variant_set_templates (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  variant_set_id uuid NOT NULL,
  template_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT variant_set_templates_pkey PRIMARY KEY (id),
  CONSTRAINT variant_set_templates_variant_set_id_fkey FOREIGN KEY (variant_set_id) REFERENCES public.variant_sets(id),
  CONSTRAINT variant_set_templates_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id)
);
CREATE TABLE public.variant_sets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  status text NOT NULL CHECK (
    status = ANY (
      ARRAY ['running'::text, 'completed'::text, 'cancelled'::text]
    )
  ),
  posts_per_template integer NOT NULL,
  winning_template_id uuid,
  confidence_score numeric,
  insights ARRAY DEFAULT '{}'::text [],
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT variant_sets_pkey PRIMARY KEY (id),
  CONSTRAINT variant_sets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT variant_sets_winning_template_id_fkey FOREIGN KEY (winning_template_id) REFERENCES public.templates(id)
);