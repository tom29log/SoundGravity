-- OPTIMIZATION: Performance Indices
-- Run this in Supabase SQL Editor to speed up Profile and Feed queries

-- 1. Index for rapid Profile lookup by username
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- 2. Index for fetching User's Projects (Profile Page)
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- 3. Index for counting Likes (Profile Page stats)
CREATE INDEX IF NOT EXISTS idx_likes_project_id ON likes(project_id);

-- 4. Index for Feed Sorting (Latest first)
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- 5. RPC Function for Fast Like Counting
-- Instead of joining tables on the client, let the DB do it instantly
CREATE OR REPLACE FUNCTION get_user_total_likes(target_user_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    total_likes BIGINT;
BEGIN
    SELECT COUNT(*)
    INTO total_likes
    FROM likes l
    JOIN projects p ON l.project_id = p.id
    WHERE p.user_id = target_user_id;
    
    RETURN total_likes;
END;
$$;
