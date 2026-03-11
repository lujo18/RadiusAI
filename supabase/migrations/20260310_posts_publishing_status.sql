-- Migration: Add 'publishing' status to posts table
-- This transient status acts as a soft lock during the publish worker's
-- in-progress window, preventing double-publishing when the cron fires again.

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_status_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_status_check CHECK (
    status = ANY (
      ARRAY ['draft'::text, 'scheduled'::text, 'publishing'::text, 'published'::text, 'failed'::text]
    )
  );
