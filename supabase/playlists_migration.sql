-- Create playlists table
CREATE TABLE IF NOT EXISTS public.playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for playlists
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for playlists
-- Everyone can read playlists
CREATE POLICY "Playlists are viewable by everyone" 
ON public.playlists FOR SELECT 
USING (true);

-- Authenticated users can create playlists
CREATE POLICY "Users can create playlists" 
ON public.playlists FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own playlists
CREATE POLICY "Users can update own playlists" 
ON public.playlists FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own playlists
CREATE POLICY "Users can delete own playlists" 
ON public.playlists FOR DELETE 
USING (auth.uid() = user_id);


-- Create playlist_tracks table (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.playlist_tracks (
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE NOT NULL,
  track_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (playlist_id, track_id)
);

-- Enable RLS for playlist_tracks
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for playlist_tracks
-- Everyone can read playlist tracks
CREATE POLICY "Playlist tracks are viewable by everyone" 
ON public.playlist_tracks FOR SELECT 
USING (true);

-- Playlist owners can add tracks (INSERTS)
-- We check if the current user is the owner of the playlist
CREATE POLICY "Playlist owners can add tracks" 
ON public.playlist_tracks FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.playlists 
    WHERE id = playlist_id 
    AND user_id = auth.uid()
  )
);

-- Playlist owners can remove tracks (DELETE)
CREATE POLICY "Playlist owners can remove tracks" 
ON public.playlist_tracks FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.playlists 
    WHERE id = playlist_id 
    AND user_id = auth.uid()
  )
);
