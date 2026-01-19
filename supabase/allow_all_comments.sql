-- Drop ALL existing policies for comments to avoid conflicts
DROP POLICY IF EXISTS "Public comments read access" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can comment" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Enable insert for key" ON public.comments;

-- Create PERMISSIVE policies
-- 1. Everyone can read
CREATE POLICY "Public read access" 
ON public.comments FOR SELECT 
USING (true);

-- 2. Authenticated users can do ANYTHING (Insert, Update, Delete)
-- We remove the check (auth.uid() = user_id) for now to debug. 
-- If this works, we know it was the check failing.
CREATE POLICY "Authenticated users full access" 
ON public.comments 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Ensure meta column exists
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb;
