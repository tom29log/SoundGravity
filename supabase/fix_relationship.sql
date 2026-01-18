-- Fix Foreign Key Relationship for Feed Join
-- The Global Feed tries to join `projects` with `profiles`. 
-- This requires a Foreign Key from `projects.user_id` to `profiles.id`.
-- Currently, it likely reference `auth.users.id`.
-- We can add an additional FK constraint to `public.profiles` to allow the join.

ALTER TABLE public.projects
ADD CONSTRAINT projects_user_id_profiles_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id);

-- If this fails because of missing profiles for some users, 
-- we might need to ensure all users have profiles first (which our seed script usually handles).
