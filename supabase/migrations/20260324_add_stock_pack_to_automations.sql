-- Add stock_pack_directory column to automations table
ALTER TABLE public.automations ADD COLUMN stock_pack_directory TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN public.automations.stock_pack_directory IS 'Selected stock pack bucket directory for image generation (e.g., "clean_girl_lifestyle"). If null, Unsplash images will be used.';
