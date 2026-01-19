-- Add Foreign Key from comments.user_id to profiles.id
-- This allows Supabase to "join" profiles when fetching comments
ALTER TABLE public.comments
ADD CONSTRAINT comments_user_id_fkey_profiles
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;
