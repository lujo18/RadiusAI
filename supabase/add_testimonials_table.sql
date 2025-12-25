-- =====================================================
-- TESTIMONIALS TABLE
-- Stores user testimonials/reviews for landing page
-- =====================================================

CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT, -- e.g., "Content Creator", "Marketing Manager"
  company TEXT, -- Optional company name
  quote TEXT NOT NULL,
  avatar_url TEXT, -- Profile photo from Supabase Storage
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  published BOOLEAN DEFAULT false, -- Show on landing page
  featured BOOLEAN DEFAULT false, -- Highlight on homepage
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_testimonials_published ON public.testimonials(published);
CREATE INDEX idx_testimonials_featured ON public.testimonials(featured);
CREATE INDEX idx_testimonials_created_at ON public.testimonials(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Public can read published testimonials
CREATE POLICY "Public can view published testimonials"
  ON public.testimonials
  FOR SELECT
  USING (published = true);

-- Authenticated users can view all (for admin dashboard)
CREATE POLICY "Authenticated users can view all testimonials"
  ON public.testimonials
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert/update/delete
-- (Use admin dashboard or direct DB access to manage)

-- =====================================================
-- SAMPLE DATA (DELETE AFTER ADDING REAL TESTIMONIALS)
-- =====================================================

INSERT INTO public.testimonials (name, role, company, quote, rating, published, featured) VALUES
('Sarah Johnson', 'Content Creator', '@sarahcreates', 'SlideForge saved me 10+ hours a week. The A/B testing feature alone is worth the price.', 5, true, true),
('Mike Chen', 'Marketing Manager', 'GrowthCo', 'We went from posting 3x/week to daily content. Engagement is up 200% since switching to SlideForge.', 5, true, true),
('Emily Rodriguez', 'Social Media Manager', 'Brand Studios', 'The templates are gorgeous and the AI actually writes good copy. This is a game-changer.', 5, true, false),
('Alex Thompson', 'Influencer', '@alexthompson', 'I was skeptical about AI content, but SlideForge nails my brand voice every time.', 4, true, false),
('Jessica Park', 'Founder', 'ParkerDigital', 'Best investment I made for my agency. Clients love the results and we can scale without hiring.', 5, true, false),
('David Kim', 'Solopreneur', null, 'Finally, a tool that doesn''t require a design degree. Simple, powerful, effective.', 5, true, false);

-- =====================================================
-- AUTO-UPDATE TIMESTAMP
-- =====================================================

CREATE OR REPLACE FUNCTION update_testimonials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER testimonials_updated_at
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW
  EXECUTE FUNCTION update_testimonials_updated_at();
