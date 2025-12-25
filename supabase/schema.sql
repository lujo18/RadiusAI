-- SlideForge Database Schema for Supabase
-- Generated from TypeScript types
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'agency')),
  template_count INTEGER NOT NULL DEFAULT 0,
  post_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- USER PROFILES TABLE
-- =====================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Brand Settings (stored as JSONB for flexibility)
  brand_settings JSONB NOT NULL,
  
  -- Counters
  template_count INTEGER NOT NULL DEFAULT 0,
  post_count INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);

-- =====================================================
-- PLATFORM INTEGRATIONS TABLE
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
-- TEMPLATES TABLE
-- =====================================================
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  category TEXT NOT NULL CHECK (category IN ('listicle', 'quote', 'story', 'educational', 'comparison', 'custom')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'testing')),
  
  -- Style configuration (JSONB for nested structures)
  style_config JSONB NOT NULL,
  
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
-- TEMPLATE PERFORMANCE TABLE
-- =====================================================
CREATE TABLE public.template_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  
  total_posts INTEGER NOT NULL DEFAULT 0,
  avg_engagement_rate DECIMAL(5,2) DEFAULT 0,
  avg_saves INTEGER DEFAULT 0,
  avg_shares INTEGER DEFAULT 0,
  avg_impressions INTEGER DEFAULT 0,
  
  last_updated TIMESTAMPTZ,
  
  UNIQUE(template_id)
);

CREATE INDEX idx_performance_template_id ON public.template_performance(template_id);

-- =====================================================
-- POSTS TABLE
-- =====================================================
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  variant_set_id UUID,
  
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  
  -- Post content (JSONB for nested PostContent structure)
  content JSONB NOT NULL,
  
  -- Storage URLs (JSONB for StorageUrls structure)
  storage_urls JSONB NOT NULL DEFAULT '{"slides": [], "thumbnail": null}'::jsonb,
  
  -- Metadata (JSONB)
  metadata JSONB DEFAULT '{}'::jsonb,
  
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

-- =====================================================
-- POST ANALYTICS TABLE
-- =====================================================
CREATE TABLE public.post_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  
  impressions INTEGER NOT NULL DEFAULT 0,
  engagement INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  
  last_updated TIMESTAMPTZ,
  
  UNIQUE(post_id)
);

CREATE INDEX idx_analytics_post_id ON public.post_analytics(post_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_analytics ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Profiles policies
CREATE POLICY "Users can view own profiles" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own profiles" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profiles" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profiles" ON public.profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Platform integrations policies
CREATE POLICY "Users can view own integrations" ON public.platform_integrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own integrations" ON public.platform_integrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations" ON public.platform_integrations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations" ON public.platform_integrations
  FOR DELETE USING (auth.uid() = user_id);

-- Templates policies
CREATE POLICY "Users can view own templates" ON public.templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own templates" ON public.templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON public.templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON public.templates
  FOR DELETE USING (auth.uid() = user_id);

-- Template performance policies (read-only for users)
CREATE POLICY "Users can view own template performance" ON public.template_performance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.templates t
      WHERE t.id = template_performance.template_id
      AND t.user_id = auth.uid()
    )
  );

-- Posts policies
CREATE POLICY "Users can view own posts" ON public.posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);

-- Post analytics policies (read-only for users)
CREATE POLICY "Users can view own post analytics" ON public.post_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_analytics.post_id
      AND p.user_id = auth.uid()
    )
  );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.platform_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user record on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, plan)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    'starter'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user record on auth signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Create storage bucket for slide images
INSERT INTO storage.buckets (id, name, public)
VALUES ('slides', 'slides', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for slides bucket
CREATE POLICY "Users can upload own slides"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'slides' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own slides"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'slides' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own slides"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'slides' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- JSONB indexes for common queries
CREATE INDEX idx_profiles_brand_settings ON public.profiles USING GIN (brand_settings);
CREATE INDEX idx_templates_style_config ON public.templates USING GIN (style_config);
CREATE INDEX idx_posts_content ON public.posts USING GIN (content);
CREATE INDEX idx_posts_metadata ON public.posts USING GIN (metadata);

-- Composite indexes for common queries
CREATE INDEX idx_posts_user_status ON public.posts(user_id, status);
CREATE INDEX idx_posts_user_created ON public.posts(user_id, created_at DESC);
CREATE INDEX idx_templates_user_category ON public.templates(user_id, category);
