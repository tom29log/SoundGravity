-- Create index on username if it doesn't exist to speed up profile lookups (TTFB optimization)
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles (username);

-- Create index on projects.user_id for faster lookups on profile page
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects (user_id);

-- Create index on likes.project_id and user_id for faster join counts
CREATE INDEX IF NOT EXISTS idx_likes_project_id ON likes (project_id);
