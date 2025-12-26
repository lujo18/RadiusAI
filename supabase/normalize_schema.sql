-- =====================================================
-- NORMALIZATION MIGRATION
-- Break down JSONB objects into proper relational tables
-- =====================================================

-- =====================================================
-- 1. BRAND SETTINGS TABLE (from profiles.brand_settings)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.brand_settings (
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

-- Trigger for updated_at
CREATE TRIGGER update_brand_settings_updated_at BEFORE UPDATE ON public.brand_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. SLIDE DESIGNS TABLE (from templates.styleConfig.slideDesigns)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.slide_designs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  dynamic BOOLEAN NOT NULL DEFAULT false,
  
  -- Background
  background_type TEXT NOT NULL CHECK (background_type IN ('solid', 'gradient', 'image')),
  background_color TEXT,
  background_gradient_colors TEXT[], -- [color1, color2]
  background_gradient_angle INTEGER,
  background_image_url TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_slide_designs_template_id ON public.slide_designs(template_id);

-- =====================================================
-- 3. TEXT ELEMENTS TABLE (from slideDesigns.elements)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.text_elements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slide_design_id UUID NOT NULL REFERENCES public.slide_designs(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  role TEXT, -- e.g., "header", "body", "cta"
  
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
-- 4. LAYOUT CONFIG TABLE (from templates.styleConfig.layout)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.layout_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL UNIQUE REFERENCES public.templates(id) ON DELETE CASCADE,
  
  slide_count INTEGER NOT NULL CHECK (slide_count >= 3 AND slide_count <= 15),
  aspect_ratio TEXT NOT NULL CHECK (aspect_ratio IN ('1:1', '4:5', '3:4', '9:16')),
  structure TEXT[] NOT NULL, -- Array of SlideStructureType
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_layout_configs_template_id ON public.layout_configs(template_id);

-- =====================================================
-- 5. CONTENT RULES TABLE (from templates.styleConfig.contentRules)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.content_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL UNIQUE REFERENCES public.templates(id) ON DELETE CASCADE,
  
  -- Structure
  format TEXT NOT NULL, -- "5 tips" or "3-part story"
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

CREATE TRIGGER update_content_rules_updated_at BEFORE UPDATE ON public.content_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. SLIDE SEQUENCE TABLE (from templates.styleConfig.slideSequence)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.slide_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  slide_design_id UUID NOT NULL REFERENCES public.slide_designs(id) ON DELETE CASCADE,
  
  slide_number INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(template_id, slide_number)
);

CREATE INDEX idx_slide_sequences_template_id ON public.slide_sequences(template_id);
CREATE INDEX idx_slide_sequences_slide_design_id ON public.slide_sequences(slide_design_id);

-- =====================================================
-- 7. POST SLIDES TABLE (from posts.content.slides)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.post_slides (
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
  image_prompt TEXT, -- AI-generated prompt for background
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(post_id, slide_number)
);

CREATE INDEX idx_post_slides_post_id ON public.post_slides(post_id);
CREATE INDEX idx_post_slides_slide_design_id ON public.post_slides(slide_design_id);

-- =====================================================
-- 8. POST SLIDE TEXT ELEMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.post_slide_text_elements (
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
-- 9. POST METADATA TABLE (from posts.metadata)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.post_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL UNIQUE REFERENCES public.posts(id) ON DELETE CASCADE,
  
  variant_label TEXT,
  generation_params JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_post_metadata_post_id ON public.post_metadata(post_id);

-- =====================================================
-- 10. STORAGE URLS TABLE (from posts.storage_urls)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.storage_urls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL UNIQUE REFERENCES public.posts(id) ON DELETE CASCADE,
  
  thumbnail TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_storage_urls_post_id ON public.storage_urls(post_id);

-- =====================================================
-- 11. STORAGE URL SLIDES TABLE (individual slide URLs)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.storage_url_slides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  storage_url_id UUID NOT NULL REFERENCES public.storage_urls(id) ON DELETE CASCADE,
  
  slide_number INTEGER NOT NULL,
  url TEXT NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(storage_url_id, slide_number)
);

CREATE INDEX idx_storage_url_slides_storage_url_id ON public.storage_url_slides(storage_url_id);

-- =====================================================
-- 12. VARIANT SETS TABLE (A/B Testing)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.variant_sets (
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
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_variant_sets_user_id ON public.variant_sets(user_id);
CREATE INDEX idx_variant_sets_status ON public.variant_sets(status);

CREATE TRIGGER update_variant_sets_updated_at BEFORE UPDATE ON public.variant_sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 13. VARIANT SET TEMPLATES (junction table)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.variant_set_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_set_id UUID NOT NULL REFERENCES public.variant_sets(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(variant_set_id, template_id)
);

CREATE INDEX idx_variant_set_templates_variant_set_id ON public.variant_set_templates(variant_set_id);
CREATE INDEX idx_variant_set_templates_template_id ON public.variant_set_templates(template_id);

-- =====================================================
-- 14. VARIANT SET INSIGHTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.variant_set_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_set_id UUID NOT NULL REFERENCES public.variant_sets(id) ON DELETE CASCADE,
  
  insight TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(variant_set_id, order_index)
);

CREATE INDEX idx_variant_set_insights_variant_set_id ON public.variant_set_insights(variant_set_id);

-- =====================================================
-- 15. VARIANT SET STATS TABLE (per template stats in a set)
-- =====================================================
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

CREATE INDEX idx_variant_set_stats_variant_set_id ON public.variant_set_stats(variant_set_id);
CREATE INDEX idx_variant_set_stats_template_id ON public.variant_set_stats(template_id);

CREATE TRIGGER update_variant_set_stats_updated_at BEFORE UPDATE ON public.variant_set_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Brand Settings
ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand settings" ON public.brand_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = brand_settings.profile_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own brand settings" ON public.brand_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = brand_settings.profile_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own brand settings" ON public.brand_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = brand_settings.profile_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own brand settings" ON public.brand_settings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = brand_settings.profile_id
      AND p.user_id = auth.uid()
    )
  );

-- Slide Designs
ALTER TABLE public.slide_designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own slide designs" ON public.slide_designs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.templates t
      WHERE t.id = slide_designs.template_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own slide designs" ON public.slide_designs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.templates t
      WHERE t.id = slide_designs.template_id
      AND t.user_id = auth.uid()
    )
  );

-- Text Elements
ALTER TABLE public.text_elements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own text elements" ON public.text_elements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.slide_designs sd
      JOIN public.templates t ON t.id = sd.template_id
      WHERE sd.id = text_elements.slide_design_id
      AND t.user_id = auth.uid()
    )
  );

-- Layout Configs
ALTER TABLE public.layout_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own layout configs" ON public.layout_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.templates t
      WHERE t.id = layout_configs.template_id
      AND t.user_id = auth.uid()
    )
  );

-- Content Rules
ALTER TABLE public.content_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own content rules" ON public.content_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.templates t
      WHERE t.id = content_rules.template_id
      AND t.user_id = auth.uid()
    )
  );

-- Slide Sequences
ALTER TABLE public.slide_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own slide sequences" ON public.slide_sequences
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.templates t
      WHERE t.id = slide_sequences.template_id
      AND t.user_id = auth.uid()
    )
  );

-- Post Slides
ALTER TABLE public.post_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own post slides" ON public.post_slides
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_slides.post_id
      AND p.user_id = auth.uid()
    )
  );

-- Post Slide Text Elements
ALTER TABLE public.post_slide_text_elements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own post slide text elements" ON public.post_slide_text_elements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.post_slides ps
      JOIN public.posts p ON p.id = ps.post_id
      WHERE ps.id = post_slide_text_elements.post_slide_id
      AND p.user_id = auth.uid()
    )
  );

-- Post Metadata
ALTER TABLE public.post_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own post metadata" ON public.post_metadata
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_metadata.post_id
      AND p.user_id = auth.uid()
    )
  );

-- Storage URLs
ALTER TABLE public.storage_urls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own storage urls" ON public.storage_urls
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = storage_urls.post_id
      AND p.user_id = auth.uid()
    )
  );

-- Storage URL Slides
ALTER TABLE public.storage_url_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own storage url slides" ON public.storage_url_slides
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.storage_urls su
      JOIN public.posts p ON p.id = su.post_id
      WHERE su.id = storage_url_slides.storage_url_id
      AND p.user_id = auth.uid()
    )
  );

-- Variant Sets
ALTER TABLE public.variant_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own variant sets" ON public.variant_sets
  FOR ALL USING (auth.uid() = user_id);

-- Variant Set Templates
ALTER TABLE public.variant_set_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own variant set templates" ON public.variant_set_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.variant_sets vs
      WHERE vs.id = variant_set_templates.variant_set_id
      AND vs.user_id = auth.uid()
    )
  );

-- Variant Set Insights
ALTER TABLE public.variant_set_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own variant set insights" ON public.variant_set_insights
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.variant_sets vs
      WHERE vs.id = variant_set_insights.variant_set_id
      AND vs.user_id = auth.uid()
    )
  );

-- Variant Set Stats
ALTER TABLE public.variant_set_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own variant set stats" ON public.variant_set_stats
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.variant_sets vs
      WHERE vs.id = variant_set_stats.variant_set_id
      AND vs.user_id = auth.uid()
    )
  );

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.brand_settings IS 'Normalized brand settings from profiles.brand_settings JSONB';
COMMENT ON TABLE public.slide_designs IS 'Normalized slide designs from templates.styleConfig.slideDesigns';
COMMENT ON TABLE public.text_elements IS 'Text elements belonging to slide designs';
COMMENT ON TABLE public.layout_configs IS 'Layout configuration for templates';
COMMENT ON TABLE public.content_rules IS 'Content generation rules for templates';
COMMENT ON TABLE public.slide_sequences IS 'Slide ordering in templates';
COMMENT ON TABLE public.post_slides IS 'Individual slides in posts with dynamic content';
COMMENT ON TABLE public.post_slide_text_elements IS 'Text elements in post slides';
COMMENT ON TABLE public.post_metadata IS 'Post metadata including variant labels and generation params';
COMMENT ON TABLE public.storage_urls IS 'Storage URLs for post slide images';
COMMENT ON TABLE public.storage_url_slides IS 'Individual slide image URLs';
COMMENT ON TABLE public.variant_sets IS 'A/B testing variant sets';
COMMENT ON TABLE public.variant_set_templates IS 'Templates participating in variant sets';
COMMENT ON TABLE public.variant_set_insights IS 'Insights from completed variant tests';
COMMENT ON TABLE public.variant_set_stats IS 'Per-template stats within variant sets';

