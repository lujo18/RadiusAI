-- Migration: Add subscription fields to profiles and update users table
-- Run this in Supabase SQL Editor to update existing database

-- 1. Add Stripe subscription fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_status TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_plan TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- Add CHECK constraints separately
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_subscription_status_check 
CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'unpaid', 'paused', 'incomplete', 'incomplete_expired', 'trialing'));

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_subscription_plan_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_subscription_plan_check 
CHECK (subscription_plan IN ('starter', 'growth', 'unlimited'));

-- 2. Add subscription_plan column to users table if it doesn't exist, or update it if it does
DO $$ 
BEGIN
  -- Try to add the column (will fail silently if it exists)
  BEGIN
    ALTER TABLE public.users ADD COLUMN subscription_plan TEXT;
  EXCEPTION
    WHEN duplicate_column THEN
      -- Column exists, make it nullable and drop defaults
      ALTER TABLE public.users 
      ALTER COLUMN subscription_plan DROP NOT NULL,
      ALTER COLUMN subscription_plan DROP DEFAULT;
  END;
END $$;

-- Drop existing constraint if present
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_subscription_plan_check;

-- Add CHECK constraint
ALTER TABLE public.users
ADD CONSTRAINT users_subscription_plan_check CHECK (subscription_plan IN ('starter', 'growth', 'unlimited'));

-- 3. Set existing users' subscription_plan to NULL (they need to subscribe)
UPDATE public.users SET subscription_plan = NULL WHERE subscription_plan IS NOT NULL;

-- 4. Create indexes for Stripe fields
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON public.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription ON public.profiles(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);

-- 5. Update the trigger function to set subscription_plan as NULL for new users and auto-create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user record
  INSERT INTO public.users (id, name, email, subscription_plan)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    NULL
  );
  
  -- Create default profile with empty brand settings
  INSERT INTO public.profiles (user_id, brand_settings)
  VALUES (
    NEW.id,
    '{}'::jsonb
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migration complete: Added subscription fields to profiles table and made users.subscription_plan nullable
