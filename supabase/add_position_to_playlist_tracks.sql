-- 1. Add position column (if it doesn't exist)
ALTER TABLE public.playlist_tracks 
ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- 2. Add UPDATE policy so users can reorder their playlist tracks
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'playlist_tracks' 
        AND policyname = 'Playlist owners can update tracks'
    ) THEN
        CREATE POLICY "Playlist owners can update tracks" 
        ON public.playlist_tracks FOR UPDATE 
        USING (
          EXISTS (
            SELECT 1 FROM public.playlists 
            WHERE id = playlist_id 
            AND user_id = auth.uid()
          )
        );
    END IF;
END
$$;
