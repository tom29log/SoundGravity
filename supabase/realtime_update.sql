-- Add meta column to comments table for timestamps and other social metadata
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb;

-- Ensure Realtime is enabled for comments
-- This usually requires enabling it in the dashboard for the table, 
-- but we can try to enable publication here if we have permissions.
-- "supabase_realtime" publication usually exists.
alter publication supabase_realtime add table public.comments;
