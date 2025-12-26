-- =====================================================
-- SLIDEFORGE/VIRALSTACK - NORMALIZED DATABASE SCHEMA
-- Full relational structure (no JSONB objects)
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE USER TABLES
-- =====================================================

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  subscription_plan TEXT CHECK (subscription_plan IN ('starter', 'growth', 'unlimited')),
  template_count INTEGER NOT NULL DEFAULT 0,
  post_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Stripe subscription data
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'unpaid', 'paused', 'incomplete', 'incomplete_expired', 'trialing')),
  subscription_plan TEXT CHECK (subscription_plan IN ('starter', 'growth', 'unlimited')),
  current_period_end TIMESTAMPTZ,
  
  -- Counters
  template_count INTEGER NOT NULL DEFAULT 0,
  post_count INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_stripe_customer ON public.profiles(stripe_customer_id);
CREATE INDEX idx_profiles_stripe_subscription ON public.profiles(stripe_subscription_id);

-- =====================================================
-- BRAND SETTINGS (normalized from profiles.brand_settings)
-- =====================================================

CREATE TABLE public.brand_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Identity
  name TEXT NOT NULL,
  niche TEXT NOT NULL,
  aesthetic TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  brand_voice TEXT NOT NULL,
  content_pillars TEXT[] NOT NULL DEFAULT '{}',
  
  -- Writing Style
  tone_of_voice TEXT NOT NULL CHECK (tone_of_voice IN ('casual', 'professional', 'humorous', 'edgy', 'inspirational')),
  emoji_usage TEXT NOT NULL CHECK (emoji_usage IN ('none', 'minimal', 'moderate', 'heavy')),
  forbidden_words TEXT[] NOT NULL DEFAULT '{}',
  preferred_words TEXT[] NOT NULL DEFAULT '{}',
  
  -- Hashtag Strategy
  hashtag_style TEXT NOT NULL CHECK (hashtag_style IN ('niche', 'trending', 'mixed')),
  hashtag_count INTEGER NOT NULL CHECK (hashtag_count >= 5 AND hashtag_count <= 30),
  hashtags TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_brand_settings_profile_id ON public.brand_settings(profile_id);

-- =====================================================
-- PLATFORM INTEGRATIONS
-- =====================================================

CREATE TABLE public.platform_integrations (
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

CREATE INDEX idx_integrations_user_id ON public.platform_integrations(user_id);
CREATE INDEX idx_integrations_profile_id ON public.platform_integrations(profile_id);

-- =====================================================
-- TEMPLATES
-- =====================================================

CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  category TEXT NOT NULL CHECK (category IN ('listicle', 'quote', 'story', 'educational', 'comparison', 'custom')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'testing')),
  parent_template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
  gemini_prompt TEXT,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  favorite BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_templates_user_id ON public.templates(user_id);
CREATE INDEX idx_templates_profile_id ON public.templates(profile_id);
CREATE INDEX idx_templates_category ON public.templates(category);
CREATE INDEX idx_templates_status ON public.templates(status);

-- =====================================================
-- LAYOUT CONFIGS (from templates.styleConfig.layout)
-- =====================================================

CREATE TABLE public.layout_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL UNIQUE REFERENCES public.templates(id) ON DELETE CASCADE,
  
  slide_count INTEGER NOT NULL CHECK (slide_count >= 3 AND slide_count <= 15),
  aspect_ratio TEXT NOT NULL CHECK (aspect_ratio IN ('1:1', '4:5', '3:4', '9:16')),
  structure TEXT[] NOT NULL, -- ['hook', 'value', 'value', 'cta']
  slide_design_ids UUID[] NOT NULL DEFAULT '{}', -- Ordered array of slide design IDs
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure array length matches slide_count
  CONSTRAINT layout_configs_slide_count_matches_designs 
    CHECK (array_length(slide_design_ids, 1) = slide_count OR array_length(slide_design_ids, 1) IS NULL)
);

CREATE INDEX idx_layout_configs_template_id ON public.layout_configs(template_id);

-- =====================================================
-- CONTENT RULES (from templates.styleConfig.contentRules)
-- =====================================================

CREATE TABLE public.content_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL UNIQUE REFERENCES public.templates(id) ON DELETE CASCADE,
  
  -- Structure
  format TEXT NOT NULL,
  slide_count INTEGER NOT NULL,
  
  -- Voice & Perspective
  perspective TEXT NOT NULL,
  depth_level TEXT NOT NULL CHECK (depth_level IN ('surface', 'detailed', 'comprehensive')),
  
  -- Topic & Focus
  topic_focus TEXT NOT NULL,
  subtopics TEXT[] DEFAULT '{}',
  
  -- Slide-Specific Instructions
  hook_style TEXT NOT NULL,
  body_style TEXT NOT NULL,
  cta_style TEXT NOT NULL,
  
  -- Content Requirements
  include_examples BOOLEAN NOT NULL DEFAULT false,
  include_statistics BOOLEAN NOT NULL DEFAULT false,
  personal_story BOOLEAN NOT NULL DEFAULT false,
  
  -- Advanced
  avoid_topics TEXT[] DEFAULT '{}',
  must_include TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_rules_template_id ON public.content_rules(template_id);

-- =====================================================
-- SLIDE DESIGNS (from templates.styleConfig.slideDesigns)
-- =====================================================

CREATE TABLE public.slide_designs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  dynamic BOOLEAN NOT NULL DEFAULT false,
  
  -- Background
  background_type TEXT NOT NULL CHECK (background_type IN ('solid', 'gradient', 'image')),
  background_color TEXT,
  background_gradient_colors TEXT[],
  background_gradient_angle INTEGER,
  background_image_url TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_slide_designs_template_id ON public.slide_designs(template_id);

-- =====================================================
-- TEXT ELEMENTS (from slideDesigns.elements)
-- =====================================================

CREATE TABLE public.text_elements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slide_design_id UUID NOT NULL REFERENCES public.slide_designs(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  role TEXT,
  
  -- Typography
  font_size INTEGER NOT NULL,
  font_family TEXT NOT NULL,
  font_style TEXT NOT NULL CHECK (font_style IN ('normal', 'bold', 'italic')),
  color TEXT NOT NULL,
  text_align TEXT NOT NULL CHECK (text_align IN ('left', 'center', 'right')),
  
  -- Position
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  width INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_text_elements_slide_design_id ON public.text_elements(slide_design_id);

-- =====================================================
-- TEMPLATE PERFORMANCE
-- =====================================================

CREATE TABLE public.template_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL UNIQUE REFERENCES public.templates(id) ON DELETE CASCADE,
  
  total_posts INTEGER NOT NULL DEFAULT 0,
  avg_engagement_rate DECIMAL(5,2) DEFAULT 0,
  avg_saves INTEGER DEFAULT 0,
  avg_shares INTEGER DEFAULT 0,
  avg_impressions INTEGER DEFAULT 0,
  
  last_updated TIMESTAMPTZ
);

CREATE INDEX idx_performance_template_id ON public.template_performance(template_id);

-- =====================================================
-- POSTS
-- =====================================================

CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  variant_set_id UUID,
  
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  
  -- Caption and hashtags (simple fields)
  caption TEXT NOT NULL DEFAULT '',
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  scheduled_time TIMESTAMPTZ,
  published_time TIMESTAMPTZ
);

CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_template_id ON public.posts(template_id);
CREATE INDEX idx_posts_profile_id ON public.posts(profile_id);
CREATE INDEX idx_posts_status ON public.posts(status);
CREATE INDEX idx_posts_scheduled_time ON public.posts(scheduled_time) WHERE status = 'scheduled';
CREATE INDEX idx_posts_variant_set_id ON public.posts(variant_set_id) WHERE variant_set_id IS NOT NULL;

-- =====================================================
-- POST SLIDES (from posts.content.slides)
-- =====================================================

CREATE TABLE public.post_slides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  slide_design_id UUID REFERENCES public.slide_designs(id) ON DELETE SET NULL,
  
  slide_number INTEGER NOT NULL,
  
  -- Background
  background_type TEXT NOT NULL CHECK (background_type IN ('solid', 'gradient', 'image')),
  background_color TEXT,
  background_gradient_colors TEXT[],
  background_gradient_angle INTEGER,
  background_image_url TEXT,
  image_prompt TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(post_id, slide_number)
);

CREATE INDEX idx_post_slides_post_id ON public.post_slides(post_id);
CREATE INDEX idx_post_slides_slide_design_id ON public.post_slides(slide_design_id);

-- =====================================================
-- POST SLIDE TEXT ELEMENTS
-- =====================================================

CREATE TABLE public.post_slide_text_elements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_slide_id UUID NOT NULL REFERENCES public.post_slides(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  role TEXT,
  
  -- Typography
  font_size INTEGER NOT NULL,
  font_family TEXT NOT NULL,
  font_style TEXT NOT NULL CHECK (font_style IN ('normal', 'bold', 'italic')),
  color TEXT NOT NULL,
  text_align TEXT NOT NULL CHECK (text_align IN ('left', 'center', 'right')),
  
  -- Position
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  width INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_post_slide_text_elements_post_slide_id ON public.post_slide_text_elements(post_slide_id);

-- =====================================================
-- POST METADATA
-- =====================================================

CREATE TABLE public.post_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL UNIQUE REFERENCES public.posts(id) ON DELETE CASCADE,
  
  variant_label TEXT,
  generation_params JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_post_metadata_post_id ON public.post_metadata(post_id);

-- =====================================================
-- STORAGE URLS
-- =====================================================

CREATE TABLE public.storage_urls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL UNIQUE REFERENCES public.posts(id) ON DELETE CASCADE,
  
  thumbnail TEXT,
  slide_urls TEXT[] NOT NULL DEFAULT '{}', -- Ordered array of slide image URLs
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_storage_urls_post_id ON public.storage_urls(post_id);

-- =====================================================
-- POST ANALYTICS
-- =====================================================

CREATE TABLE public.post_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL UNIQUE REFERENCES public.posts(id) ON DELETE CASCADE,
  
  impressions INTEGER NOT NULL DEFAULT 0,
  engagement INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  
  last_updated TIMESTAMPTZ
);

CREATE INDEX idx_analytics_post_id ON public.post_analytics(post_id);

-- =====================================================
-- VARIANT SETS (A/B Testing)
-- =====================================================

CREATE TABLE public.variant_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'cancelled')),
  posts_per_template INTEGER NOT NULL,
  
  -- Results
  winning_template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
  confidence_score DECIMAL(5,2),
  insights TEXT[] DEFAULT '{}', -- Array of insight strings
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_variant_sets_user_id ON public.variant_sets(user_id);
CREATE INDEX idx_variant_sets_status ON public.variant_sets(status);

CREATE TABLE public.variant_set_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_set_id UUID NOT NULL REFERENCES public.variant_sets(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(variant_set_id, template_id)
);

CREATE INDEX idx_variant_set_templates_variant_set_id ON public.variant_set_templates(variant_set_id);
CREATE INDEX idx_variant_set_templates_template_id ON public.variant_set_templates(template_id);

CREATE TABLE public.variant_set_stats (
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

CREATE INDEX idx_variant_set_stats_variant_set_id ON public.variant_set_stats(variant_set_id);
CREATE INDEX idx_variant_set_stats_template_id ON public.variant_set_stats(template_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layout_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slide_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.text_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_slide_text_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_set_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_set_stats ENABLE ROW LEVEL SECURITY;

-- Users
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Profiles
CREATE POLICY "Users can view own profiles" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own profiles" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profiles" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profiles" ON public.profiles FOR DELETE USING (auth.uid() = user_id);

-- Brand Settings
CREATE POLICY "Users can manage own brand settings" ON public.brand_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = brand_settings.profile_id AND p.user_id = auth.uid())
);

-- Platform Integrations
CREATE POLICY "Users can manage own integrations" ON public.platform_integrations FOR ALL USING (auth.uid() = user_id);

-- Templates
CREATE POLICY "Users can manage own templates" ON public.templates FOR ALL USING (auth.uid() = user_id);

-- Layout Configs
CREATE POLICY "Users can manage own layout configs" ON public.layout_configs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.templates t WHERE t.id = layout_configs.template_id AND t.user_id = auth.uid())
);

-- Content Rules
CREATE POLICY "Users can manage own content rules" ON public.content_rules FOR ALL USING (
  EXISTS (SELECT 1 FROM public.templates t WHERE t.id = content_rules.template_id AND t.user_id = auth.uid())
);

-- Slide Designs
CREATE POLICY "Users can manage own slide designs" ON public.slide_designs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.templates t WHERE t.id = slide_designs.template_id AND t.user_id = auth.uid())
);

-- Text Elements
CREATE POLICY "Users can manage own text elements" ON public.text_elements FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.slide_designs sd
    JOIN public.templates t ON t.id = sd.template_id
    WHERE sd.id = text_elements.slide_design_id AND t.user_id = auth.uid()
  )
);

-- Template Performance
CREATE POLICY "Users can view own template performance" ON public.template_performance FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_performance.template_id AND t.user_id = auth.uid())
);

-- Posts
CREATE POLICY "Users can manage own posts" ON public.posts FOR ALL USING (auth.uid() = user_id);

-- Post Slides
CREATE POLICY "Users can manage own post slides" ON public.post_slides FOR ALL USING (
  EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_slides.post_id AND p.user_id = auth.uid())
);

-- Post Slide Text Elements
CREATE POLICY "Users can manage own post slide text elements" ON public.post_slide_text_elements FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.post_slides ps
    JOIN public.posts p ON p.id = ps.post_id
    WHERE ps.id = post_slide_text_elements.post_slide_id AND p.user_id = auth.uid()
  )
);

-- Post Metadata
CREATE POLICY "Users can manage own post metadata" ON public.post_metadata FOR ALL USING (
  EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_metadata.post_id AND p.user_id = auth.uid())
);

-- Storage URLs
CREATE POLICY "Users can manage own storage urls" ON public.storage_urls FOR ALL USING (
  EXISTS (SELECT 1 FROM public.posts p WHERE p.id = storage_urls.post_id AND p.user_id = auth.uid())
);

-- Post Analytics
CREATE POLICY "Users can view own post analytics" ON public.post_analytics FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_analytics.post_id AND p.user_id = auth.uid())
);

-- Variant Sets
CREATE POLICY "Users can manage own variant sets" ON public.variant_sets FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own variant set templates" ON public.variant_set_templates FOR ALL USING (
  EXISTS (SELECT 1 FROM public.variant_sets vs WHERE vs.id = variant_set_templates.variant_set_id AND vs.user_id = auth.uid())
);

CREATE POLICY "Users can manage own variant set stats" ON public.variant_set_stats FOR ALL USING (
  EXISTS (SELECT 1 FROM public.variant_sets vs WHERE vs.id = variant_set_stats.variant_set_id AND vs.user_id = auth.uid())
);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brand_settings_updated_at BEFORE UPDATE ON public.brand_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.platform_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON public.templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_rules_updated_at BEFORE UPDATE ON public.content_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_variant_sets_updated_at BEFORE UPDATE ON public.variant_sets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_variant_set_stats_updated_at BEFORE UPDATE ON public.variant_set_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create user on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, subscription_plan)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    NULL
  );
  
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('slides', 'slides', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own slides" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'slides' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own slides" ON storage.objects FOR SELECT USING (
  bucket_id = 'slides' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own slides" ON storage.objects FOR DELETE USING (
  bucket_id = 'slides' AND auth.uid()::text = (storage.foldername(name))[1]
);

