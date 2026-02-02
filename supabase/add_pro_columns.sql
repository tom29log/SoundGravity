-- Add is_pro column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE;

-- Add stem_separations_count column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stem_separations_count INTEGER DEFAULT 0;

-- Optional: Add a comment
COMMENT ON COLUMN public.profiles.is_pro IS 'Whether the user has a Pro subscription';
COMMENT ON COLUMN public.profiles.stem_separations_count IS 'Number of stem separations performed by the user';
