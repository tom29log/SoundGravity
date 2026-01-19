-- Add bio column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio text;

-- Comment for documentation
COMMENT ON COLUMN public.profiles.bio IS 'User bio / one-line introduction';
