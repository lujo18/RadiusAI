-- Add new plan limit columns: max_brands and ai_credits
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS max_brands integer;

ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS ai_credits integer;

-- Optionally, ensure indexes or defaults can be added here later
