-- Add TikTok disclosure columns to automations table
ALTER TABLE public.automations
ADD COLUMN IF NOT EXISTS is_ai_generated boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS brand_content_toggle boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS brand_organic_toggle boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS disable_duet boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS disable_stitch boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS disable_comment boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS privacy_level text DEFAULT 'PUBLIC' CHECK (
  privacy_level = ANY (ARRAY['PUBLIC'::text, 'MUTUAL_FOLLOW_FRIENDS'::text, 'SELF_ONLY'::text])
);

-- Add comment to document the new fields
COMMENT ON COLUMN public.automations.is_ai_generated IS 'Disclose that content is AI-generated (TikTok specific)';
COMMENT ON COLUMN public.automations.brand_content_toggle IS 'Disclose brand/sponsored content (TikTok specific)';
COMMENT ON COLUMN public.automations.brand_organic_toggle IS 'Organic brand content toggle (TikTok specific)';
COMMENT ON COLUMN public.automations.disable_duet IS 'Disable TikTok duets on this automation posts';
COMMENT ON COLUMN public.automations.disable_stitch IS 'Disable TikTok stitches on this automation posts';
COMMENT ON COLUMN public.automations.disable_comment IS 'Disable comments on this automation posts';
COMMENT ON COLUMN public.automations.privacy_level IS 'TikTok privacy level: PUBLIC, MUTUAL_FOLLOW_FRIENDS, or SELF_ONLY';
