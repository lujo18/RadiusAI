-- Migration: Switch platform_integrations unique constraint from (user_id, platform, username)
--            to (brand_id, platform), making it brand-scoped not user-scoped.

-- 1. Drop the old user-scoped unique constraint (and any related indexes)
ALTER TABLE public.platform_integrations
  DROP CONSTRAINT IF EXISTS platform_integrations_user_id_platform_username_key;

-- Also drop by index name variants that Supabase might have generated
DROP INDEX IF EXISTS public.platform_integrations_user_id_platform_username_key;

-- 2. Add brand_id column if it doesn't already exist (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name   = 'platform_integrations'
       AND column_name  = 'brand_id'
  ) THEN
    ALTER TABLE public.platform_integrations
      ADD COLUMN brand_id uuid NOT NULL REFERENCES public.brand(id);
  END IF;
END;
$$;

-- 3. Make user_id nullable (it was NOT NULL but is now just a soft reference)
ALTER TABLE public.platform_integrations
  ALTER COLUMN user_id DROP NOT NULL;

-- 4. Add the new brand-scoped unique constraint used by the upsert
ALTER TABLE public.platform_integrations
  DROP CONSTRAINT IF EXISTS platform_integrations_brand_id_platform_key;

ALTER TABLE public.platform_integrations
  ADD CONSTRAINT platform_integrations_brand_id_platform_key
  UNIQUE (brand_id, platform);
