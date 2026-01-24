-- Create a new storage bucket for stems
INSERT INTO storage.buckets (id, name, public)
VALUES ('stems', 'stems', false) -- Private bucket by default for better control
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to view/download stems
-- Adjust this if you want it to be public or restricted to purchases only
-- For now, allowing all authenticated users to read
CREATE POLICY "Authenticated users can download stems"
ON storage.objects FOR SELECT
USING ( bucket_id = 'stems' AND auth.role() = 'authenticated' );

-- Policy to allow users to upload stems
-- Ideally, limit this to verified artists or specific logic
-- For now, allowing any authenticated user to upload to their own folder structure or generally
CREATE POLICY "Authenticated users can upload stems"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'stems' 
    AND auth.role() = 'authenticated'
    -- Optional: Enforce folder structure like owner_id/filename if needed
    -- AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow users to update their own stems
CREATE POLICY "Users can update own stems"
ON storage.objects FOR UPDATE
USING (bucket_id = 'stems' AND owner = auth.uid())
WITH CHECK (bucket_id = 'stems' AND owner = auth.uid());

-- Policy to allow users to delete their own stems
CREATE POLICY "Users can delete own stems"
ON storage.objects FOR DELETE
USING (bucket_id = 'stems' AND owner = auth.uid());
