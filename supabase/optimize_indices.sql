-- Optimize Profile Page Queries
-- 1. Index for fetching profile by username
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- 2. Index for counting likes by project
CREATE INDEX IF NOT EXISTS idx_likes_project_id ON public.likes(project_id);

-- 3. Index for fetching projects by user
CREATE INDEX IF NOT EXISTS idx_projects_user_id_created_at ON public.projects(user_id, created_at DESC);
