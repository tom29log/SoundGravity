-- Add header_image_url column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS header_image_url TEXT;

-- Update RLS if necessary (Usually covered by existing policies)
