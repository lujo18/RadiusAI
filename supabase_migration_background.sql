-- Migration: Consolidate background properties into JSONB column

-- Step 1: Add new background JSONB column
ALTER TABLE public.post_slides ADD COLUMN background jsonb;

-- Step 2: Migrate existing data to JSONB format
UPDATE public.post_slides
SET background = CASE
  WHEN background_type = 'solid' THEN
    jsonb_build_object('type', background_type, 'color', background_color)
  WHEN background_type = 'gradient' THEN
    jsonb_build_object(
      'type', background_type,
      'gradient_colors', background_gradient_colors,
      'gradient_angle', background_gradient_angle
    )
  WHEN background_type = 'image' THEN
    jsonb_build_object('type', background_type, 'image_url', background_image_url)
  ELSE
    jsonb_build_object('type', background_type)
END;

-- Step 3: Make background column NOT NULL after migration
ALTER TABLE public.post_slides ALTER COLUMN background SET NOT NULL;

-- Step 4: Drop old columns
ALTER TABLE public.post_slides
DROP COLUMN background_type,
DROP COLUMN background_color,
DROP COLUMN background_gradient_colors,
DROP COLUMN background_gradient_angle,
DROP COLUMN background_image_url;

-- Step 5: Add constraint for background JSONB structure
ALTER TABLE public.post_slides ADD CONSTRAINT post_slides_background_check CHECK (
  background ? 'type' AND
  background->>'type' IN ('solid', 'gradient', 'image')
);

-- Step 6: Update indexes if needed (existing indexes should be fine)