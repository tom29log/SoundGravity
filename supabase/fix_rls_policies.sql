-- Enable UPDATE on likes to allow UPSERT operations
-- (Upsert tries to update on conflict, even if it effectively does nothing new)
CREATE POLICY "Authenticated users can update own likes" 
ON public.likes 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure meta column exists on comments (redundant safety check)
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb;
