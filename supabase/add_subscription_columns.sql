-- Add subscription-related columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS subscription_id TEXT,
ADD COLUMN IF NOT EXISTS lemonsqueezy_customer_id TEXT;

-- Add index for faster subscription lookups
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_id ON public.profiles(subscription_id);
CREATE INDEX IF NOT EXISTS idx_profiles_lemonsqueezy_customer_id ON public.profiles(lemonsqueezy_customer_id);

-- Comment on columns
COMMENT ON COLUMN public.profiles.is_pro IS 'Whether the user has an active Pro subscription';
COMMENT ON COLUMN public.profiles.subscription_id IS 'LemonSqueezy subscription ID';
COMMENT ON COLUMN public.profiles.lemonsqueezy_customer_id IS 'LemonSqueezy customer ID';
