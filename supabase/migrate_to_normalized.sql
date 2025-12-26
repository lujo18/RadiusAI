-- =====================================================
-- MIGRATION: Existing DB → Normalized Schema
-- Safe to run on existing database - uses IF NOT EXISTS
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. UPDATE EXISTING TABLES (add missing columns)
-- =====================================================

-- Users table - add subscription_plan if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_plan') THEN
    ALTER TABLE public.users ADD COLUMN subscription_plan TEXT CHECK (subscription_plan IN ('starter', 'growth', 'unlimited'));
  END IF;
END $$;

-- Profiles table - add Stripe fields if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id') THEN
    ALTER TABLE public.profiles ADD COLUMN stripe_customer_id TEXT;
    ALTER TABLE public.profiles ADD COLUMN stripe_subscription_id TEXT;
    ALTER TABLE public.profiles ADD COLUMN subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'unpaid', 'paused', 'incomplete', 'incomplete_expired', 'trialing'));
    ALTER TABLE public.profiles ADD COLUMN subscription_plan TEXT CHECK (subscription_plan IN ('starter', 'growth', 'unlimited'));
    ALTER TABLE public.profiles ADD COLUMN current_period_end TIMESTAMPTZ;
    
    CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON public.profiles(stripe_customer_id);
    CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription ON public.profiles(stripe_subscription_id);
  END IF;
END $$;

-- Layout configs - add slide_design_ids array if missing
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'layout_configs') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'layout_configs' AND column_name = 'slide_design_ids') THEN
      ALTER TABLE public.layout_configs ADD COLUMN slide_design_ids UUID[] NOT NULL DEFAULT '{}';
      
      -- Add constraint
      ALTER TABLE public.layout_configs ADD CONSTRAINT layout_configs_slide_count_matches_designs 
        CHECK (array_length(slide_design_ids, 1) = slide_count OR array_length(slide_design_ids, 1) IS NULL);
    END IF;
  END IF;
END $$;

-- Storage URLs - add slide_urls array if missing
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'storage_urls') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'storage_urls' AND column_name = 'slide_urls') THEN
      ALTER TABLE public.storage_urls ADD COLUMN slide_urls TEXT[] NOT NULL DEFAULT '{}';
    END IF;
  END IF;
END $$;

-- Variant sets - add insights array if missing
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'variant_sets') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'variant_sets' AND column_name = 'insights') THEN
      ALTER TABLE public.variant_sets ADD COLUMN insights TEXT[] DEFAULT '{}';
    END IF;
  END IF;
END $$;

-- =====================================================
-- 2. CREATE NEW TABLES (if they don't exist)
-- =====================================================

-- Brand Settings
CREATE TABLE IF NOT EXISTS public.brand_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  niche TEXT NOT NULL,
  aesthetic TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  brand_voice TEXT NOT NULL,
  content_pillars TEXT[] NOT NULL DEFAULT '{}',
  
  tone_of_voice TEXT NOT NULL CHECK (tone_of_voice IN ('casual', 'professional', 'humorous', 'edgy', 'inspirational')),
  emoji_usage TEXT NOT NULL CHECK (emoji_usage IN ('none', 'minimal', 'moderate', 'heavy')),
  forbidden_words TEXT[] NOT NULL DEFAULT '{}',
  preferred_words TEXT[] NOT NULL DEFAULT '{}',
  
  hashtag_style TEXT NOT NULL CHECK (hashtag_style IN ('niche', 'trending', 'mixed')),
  hashtag_count INTEGER NOT NULL CHECK (hashtag_count >= 5 AND hashtag_count <= 30),
  hashtags TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brand_settings_profile_id ON public.brand_settings(profile_id);

-- Platform Integrations (might exist already)
CREATE TABLE IF NOT EXISTS public.platform_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  platform TEXT NOT NULL CHECK (platform IN ('Instagram', 'TikTok', 'Twitter', 'Facebook')),
  username TEXT NOT NULL,
  full_name TEXT,
  profile_picture_url TEXT,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  bio TEXT,
  website_url TEXT,
  is_business_account BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, platform, username)
);

CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON public.platform_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_profile_id ON public.platform_integrations(profile_id);

-- Layout Configs (might exist)
CREATE TABLE IF NOT EXISTS public.layout_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL UNIQUE REFERENCES public.templates(id) ON DELETE CASCADE,
  
  slide_count INTEGER NOT NULL CHECK (slide_count >= 3 AND slide_count <= 15),
  aspect_ratio TEXT NOT NULL CHECK (aspect_ratio IN ('1:1', '4:5', '3:4', '9:16')),
  structure TEXT[] NOT NULL,
  slide_design_ids UUID[] NOT NULL DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT layout_configs_slide_count_matches_designs 
    CHECK (array_length(slide_design_ids, 1) = slide_count OR array_length(slide_design_ids, 1) IS NULL)
);

CREATE INDEX IF NOT EXISTS idx_layout_configs_template_id ON public.layout_configs(template_id);

-- Content Rules
CREATE TABLE IF NOT EXISTS public.content_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL UNIQUE REFERENCES public.templates(id) ON DELETE CASCADE,
  
  format TEXT NOT NULL,
  slide_count INTEGER NOT NULL,
  perspective TEXT NOT NULL,
  depth_level TEXT NOT NULL CHECK (depth_level IN ('surface', 'detailed', 'comprehensive')),
  topic_focus TEXT NOT NULL,
  subtopics TEXT[] DEFAULT '{}',
  hook_style TEXT NOT NULL,
  body_style TEXT NOT NULL,
  cta_style TEXT NOT NULL,
  include_examples BOOLEAN NOT NULL DEFAULT false,
  include_statistics BOOLEAN NOT NULL DEFAULT false,
  personal_story BOOLEAN NOT NULL DEFAULT false,
  avoid_topics TEXT[] DEFAULT '{}',
  must_include TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_rules_template_id ON public.content_rules(template_id);

-- Slide Designs
CREATE TABLE IF NOT EXISTS public.slide_designs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  dynamic BOOLEAN NOT NULL DEFAULT false,
  background_type TEXT NOT NULL CHECK (background_type IN ('solid', 'gradient', 'image')),
  background_color TEXT,
  background_gradient_colors TEXT[],
  background_gradient_angle INTEGER,
  background_image_url TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_slide_designs_template_id ON public.slide_designs(template_id);

-- Text Elements
CREATE TABLE IF NOT EXISTS public.text_elements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slide_design_id UUID NOT NULL REFERENCES public.slide_designs(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  role TEXT,
  font_size INTEGER NOT NULL,
  font_family TEXT NOT NULL,
  font_style TEXT NOT NULL CHECK (font_style IN ('normal', 'bold', 'italic')),
  color TEXT NOT NULL,
  text_align TEXT NOT NULL CHECK (text_align IN ('left', 'center', 'right')),
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  width INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_text_elements_slide_design_id ON public.text_elements(slide_design_id);

-- Template Performance
CREATE TABLE IF NOT EXISTS public.template_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL UNIQUE REFERENCES public.templates(id) ON DELETE CASCADE,
  
  total_posts INTEGER NOT NULL DEFAULT 0,
  avg_engagement_rate DECIMAL(5,2) DEFAULT 0,
  avg_saves INTEGER DEFAULT 0,
  avg_shares INTEGER DEFAULT 0,
  avg_impressions INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_performance_template_id ON public.template_performance(template_id);

-- Post Slides
CREATE TABLE IF NOT EXISTS public.post_slides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  slide_design_id UUID REFERENCES public.slide_designs(id) ON DELETE SET NULL,
  
  slide_number INTEGER NOT NULL,
  background_type TEXT NOT NULL CHECK (background_type IN ('solid', 'gradient', 'image')),
  background_color TEXT,
  background_gradient_colors TEXT[],
  background_gradient_angle INTEGER,
  background_image_url TEXT,
  image_prompt TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(post_id, slide_number)
);

CREATE INDEX IF NOT EXISTS idx_post_slides_post_id ON public.post_slides(post_id);
CREATE INDEX IF NOT EXISTS idx_post_slides_slide_design_id ON public.post_slides(slide_design_id);

-- Post Slide Text Elements
CREATE TABLE IF NOT EXISTS public.post_slide_text_elements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_slide_id UUID NOT NULL REFERENCES public.post_slides(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  role TEXT,
  font_size INTEGER NOT NULL,
  font_family TEXT NOT NULL,
  font_style TEXT NOT NULL CHECK (font_style IN ('normal', 'bold', 'italic')),
  color TEXT NOT NULL,
  text_align TEXT NOT NULL CHECK (text_align IN ('left', 'center', 'right')),
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  width INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_slide_text_elements_post_slide_id ON public.post_slide_text_elements(post_slide_id);

-- Post Metadata
CREATE TABLE IF NOT EXISTS public.post_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL UNIQUE REFERENCES public.posts(id) ON DELETE CASCADE,
  
  variant_label TEXT,
  generation_params JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_metadata_post_id ON public.post_metadata(post_id);

-- Storage URLs
CREATE TABLE IF NOT EXISTS public.storage_urls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL UNIQUE REFERENCES public.posts(id) ON DELETE CASCADE,
  
  thumbnail TEXT,
  slide_urls TEXT[] NOT NULL DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_storage_urls_post_id ON public.storage_urls(post_id);

-- Post Analytics
CREATE TABLE IF NOT EXISTS public.post_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL UNIQUE REFERENCES public.posts(id) ON DELETE CASCADE,
  
  impressions INTEGER NOT NULL DEFAULT 0,
  engagement INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  last_updated TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_analytics_post_id ON public.post_analytics(post_id);

-- Variant Sets
CREATE TABLE IF NOT EXISTS public.variant_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'cancelled')),
  posts_per_template INTEGER NOT NULL,
  winning_template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
  confidence_score DECIMAL(5,2),
  insights TEXT[] DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_variant_sets_user_id ON public.variant_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_variant_sets_status ON public.variant_sets(status);

-- Variant Set Templates
CREATE TABLE IF NOT EXISTS public.variant_set_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_set_id UUID NOT NULL REFERENCES public.variant_sets(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(variant_set_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_variant_set_templates_variant_set_id ON public.variant_set_templates(variant_set_id);
CREATE INDEX IF NOT EXISTS idx_variant_set_templates_template_id ON public.variant_set_templates(template_id);

-- Variant Set Stats
CREATE TABLE IF NOT EXISTS public.variant_set_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_set_id UUID NOT NULL REFERENCES public.variant_sets(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  
  avg_saves DECIMAL(10,2) NOT NULL DEFAULT 0,
  avg_engagement DECIMAL(10,2) NOT NULL DEFAULT 0,
  avg_impressions INTEGER NOT NULL DEFAULT 0,
  avg_engagement_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  total_posts INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(variant_set_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_variant_set_stats_variant_set_id ON public.variant_set_stats(variant_set_id);
CREATE INDEX IF NOT EXISTS idx_variant_set_stats_template_id ON public.variant_set_stats(template_id);

-- =====================================================
-- 3. ENABLE RLS ON NEW TABLES
-- =====================================================

ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layout_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slide_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.text_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_slide_text_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_set_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_set_stats ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. CREATE RLS POLICIES (IF NOT EXISTS pattern)
-- =====================================================

-- Brand Settings
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'brand_settings' AND policyname = 'Users can manage own brand settings') THEN
    CREATE POLICY "Users can manage own brand settings" ON public.brand_settings FOR ALL USING (
      EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = brand_settings.profile_id AND p.user_id = auth.uid())
    );
  END IF;
END $$;

-- Layout Configs
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'layout_configs' AND policyname = 'Users can manage own layout configs') THEN
    CREATE POLICY "Users can manage own layout configs" ON public.layout_configs FOR ALL USING (
      EXISTS (SELECT 1 FROM public.templates t WHERE t.id = layout_configs.template_id AND t.user_id = auth.uid())
    );
  END IF;
END $$;

-- Content Rules
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_rules' AND policyname = 'Users can manage own content rules') THEN
    CREATE POLICY "Users can manage own content rules" ON public.content_rules FOR ALL USING (
      EXISTS (SELECT 1 FROM public.templates t WHERE t.id = content_rules.template_id AND t.user_id = auth.uid())
    );
  END IF;
END $$;

-- Slide Designs
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'slide_designs' AND policyname = 'Users can manage own slide designs') THEN
    CREATE POLICY "Users can manage own slide designs" ON public.slide_designs FOR ALL USING (
      EXISTS (SELECT 1 FROM public.templates t WHERE t.id = slide_designs.template_id AND t.user_id = auth.uid())
    );
  END IF;
END $$;

-- Text Elements
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'text_elements' AND policyname = 'Users can manage own text elements') THEN
    CREATE POLICY "Users can manage own text elements" ON public.text_elements FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.slide_designs sd
        JOIN public.templates t ON t.id = sd.template_id
        WHERE sd.id = text_elements.slide_design_id AND t.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Template Performance
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'template_performance' AND policyname = 'Users can view own template performance') THEN
    CREATE POLICY "Users can view own template performance" ON public.template_performance FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_performance.template_id AND t.user_id = auth.uid())
    );
  END IF;
END $$;

-- Post Slides
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_slides' AND policyname = 'Users can manage own post slides') THEN
    CREATE POLICY "Users can manage own post slides" ON public.post_slides FOR ALL USING (
      EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_slides.post_id AND p.user_id = auth.uid())
    );
  END IF;
END $$;

-- Post Slide Text Elements
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_slide_text_elements' AND policyname = 'Users can manage own post slide text elements') THEN
    CREATE POLICY "Users can manage own post slide text elements" ON public.post_slide_text_elements FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.post_slides ps
        JOIN public.posts p ON p.id = ps.post_id
        WHERE ps.id = post_slide_text_elements.post_slide_id AND p.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Post Metadata
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_metadata' AND policyname = 'Users can manage own post metadata') THEN
    CREATE POLICY "Users can manage own post metadata" ON public.post_metadata FOR ALL USING (
      EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_metadata.post_id AND p.user_id = auth.uid())
    );
  END IF;
END $$;

-- Storage URLs
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'storage_urls' AND policyname = 'Users can manage own storage urls') THEN
    CREATE POLICY "Users can manage own storage urls" ON public.storage_urls FOR ALL USING (
      EXISTS (SELECT 1 FROM public.posts p WHERE p.id = storage_urls.post_id AND p.user_id = auth.uid())
    );
  END IF;
END $$;

-- Post Analytics
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_analytics' AND policyname = 'Users can view own post analytics') THEN
    CREATE POLICY "Users can view own post analytics" ON public.post_analytics FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_analytics.post_id AND p.user_id = auth.uid())
    );
  END IF;
END $$;

-- Variant Sets
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'variant_sets' AND policyname = 'Users can manage own variant sets') THEN
    CREATE POLICY "Users can manage own variant sets" ON public.variant_sets FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Variant Set Templates
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'variant_set_templates' AND policyname = 'Users can manage own variant set templates') THEN
    CREATE POLICY "Users can manage own variant set templates" ON public.variant_set_templates FOR ALL USING (
      EXISTS (SELECT 1 FROM public.variant_sets vs WHERE vs.id = variant_set_templates.variant_set_id AND vs.user_id = auth.uid())
    );
  END IF;
END $$;

-- Variant Set Stats
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'variant_set_stats' AND policyname = 'Users can manage own variant set stats') THEN
    CREATE POLICY "Users can manage own variant set stats" ON public.variant_set_stats FOR ALL USING (
      EXISTS (SELECT 1 FROM public.variant_sets vs WHERE vs.id = variant_set_stats.variant_set_id AND vs.user_id = auth.uid())
    );
  END IF;
END $$;

-- =====================================================
-- 5. CREATE/UPDATE TRIGGERS
-- =====================================================

-- Updated at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers (DROP IF EXISTS first)
DROP TRIGGER IF EXISTS update_brand_settings_updated_at ON public.brand_settings;
CREATE TRIGGER update_brand_settings_updated_at BEFORE UPDATE ON public.brand_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_rules_updated_at ON public.content_rules;
CREATE TRIGGER update_content_rules_updated_at BEFORE UPDATE ON public.content_rules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_variant_sets_updated_at ON public.variant_sets;
CREATE TRIGGER update_variant_sets_updated_at BEFORE UPDATE ON public.variant_sets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_variant_set_stats_updated_at ON public.variant_set_stats;
CREATE TRIGGER update_variant_set_stats_updated_at BEFORE UPDATE ON public.variant_set_stats 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. STORAGE BUCKETS
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('slides', 'slides', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies first
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can upload own slides" ON storage.objects;
  DROP POLICY IF EXISTS "Users can view own slides" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own slides" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create storage policies
CREATE POLICY "Users can upload own slides" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'slides' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own slides" ON storage.objects FOR SELECT USING (
  bucket_id = 'slides' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own slides" ON storage.objects FOR DELETE USING (
  bucket_id = 'slides' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- All new tables and columns have been added safely
-- Existing data is preserved
-- You can now start using the normalized schema
