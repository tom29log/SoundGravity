-- 1. Add followers_count to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;

-- 2. Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (follower_id, following_id)
);

-- 3. Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Anyone can read follows (to see who follows who)
CREATE POLICY "Follows are viewable by everyone" 
ON public.follows FOR SELECT 
USING (true);

-- Authenticated users can follow others
CREATE POLICY "Users can follow others" 
ON public.follows FOR INSERT 
WITH CHECK (auth.uid() = follower_id);

-- Authenticated users can unfollow (delete their own follow record)
CREATE POLICY "Users can unfollow" 
ON public.follows FOR DELETE 
USING (auth.uid() = follower_id);

-- 5. Trigger Function for Auto-Count
CREATE OR REPLACE FUNCTION public.handle_new_follow() 
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET followers_count = followers_count + 1
  WHERE id = NEW.following_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_unfollow() 
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET followers_count = followers_count - 1
  WHERE id = OLD.following_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Attach Triggers
DROP TRIGGER IF EXISTS on_follow_added ON public.follows;
CREATE TRIGGER on_follow_added
AFTER INSERT ON public.follows
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_follow();

DROP TRIGGER IF EXISTS on_follow_removed ON public.follows;
CREATE TRIGGER on_follow_removed
AFTER DELETE ON public.follows
FOR EACH ROW EXECUTE PROCEDURE public.handle_unfollow();
