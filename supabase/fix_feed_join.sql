-- Add explicit foreign key from projects.user_id to profiles.id
-- This allows PostgREST to detect the relationship for joins like select('*, profiles(*)')

ALTER TABLE public.projects
DROP CONSTRAINT IF EXISTS projects_user_id_fkey_profiles; -- Drop if exists to avoid error

ALTER TABLE public.projects
ADD CONSTRAINT projects_user_id_fkey_profiles
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;
