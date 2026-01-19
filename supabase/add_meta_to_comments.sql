-- Add meta column to comments table
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb;
