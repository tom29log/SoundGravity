-- Add Artist Type and Genre columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS artist_type TEXT,
ADD COLUMN IF NOT EXISTS primary_genre TEXT;

-- Update RLS if necessary (Though existing update policy is often broad)
-- Assuming 'Users can update own profile' policy handles 'using (auth.uid() = id)' which covers all columns.
