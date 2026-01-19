-- Add social_links column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Example structure for social_links:
-- {
--   "instagram": "https://instagram.com/username",
--   "soundcloud": "https://soundcloud.com/username",
--   "twitter": "..."
-- }
