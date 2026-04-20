-- Create blog_posts table for admin-authored marketing content
BEGIN;

CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT NOT NULL,
    cover_image_url TEXT,
    seo_keywords TEXT[] NOT NULL DEFAULT '{}',
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_blog_posts_slug ON public.blog_posts (slug);
CREATE INDEX IF NOT EXISTS ix_blog_posts_is_published ON public.blog_posts (is_published);
CREATE INDEX IF NOT EXISTS ix_blog_posts_published_at ON public.blog_posts (published_at DESC);
CREATE INDEX IF NOT EXISTS ix_blog_posts_updated_at ON public.blog_posts (updated_at DESC);

-- Keep updated_at in sync on UPDATE
CREATE OR REPLACE FUNCTION public.set_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER trg_set_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.set_blog_posts_updated_at();

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published blog posts" ON public.blog_posts;
CREATE POLICY "Public can read published blog posts"
ON public.blog_posts
FOR SELECT
USING (is_published = TRUE);

DROP POLICY IF EXISTS "Admins can manage blog posts" ON public.blog_posts;
CREATE POLICY "Admins can manage blog posts"
ON public.blog_posts
FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM public.users u
        WHERE u.id = auth.uid()
          AND u.is_admin = TRUE
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.users u
        WHERE u.id = auth.uid()
          AND u.is_admin = TRUE
    )
);

COMMIT;
