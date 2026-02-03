-- Add lemonsqueezy_customer_id column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS lemonsqueezy_customer_id TEXT;

-- Optional: Add a comment
COMMENT ON COLUMN public.profiles.lemonsqueezy_customer_id IS 'Lemon Squeezy Customer ID for Portal Access';
