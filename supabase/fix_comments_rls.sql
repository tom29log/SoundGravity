-- Ensure meta column exists
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb;

-- Drop existing policies to avoid conflicts (clean slate for comments)
DROP POLICY IF EXISTS "Public comments read access" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can comment" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can update own comments" ON public.comments;

-- Re-create policies
CREATE POLICY "Public comments read access" 
ON public.comments FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can comment" 
ON public.comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.comments FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own comments" 
ON public.comments FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
