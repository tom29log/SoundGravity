-- Add is_hidden to projects
ALTER TABLE projects ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE;

-- Create reports table
CREATE TABLE reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID REFERENCES auth.users(id),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT DEFAULT 'pending', -- pending, resolved, dismissed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for projects (Update existing select policy to filter hidden, unless user is owner or admin?)
-- Actually, easier to handle filtering in the query or generic View, but RLS is safer.
-- Let's assume public can view if not hidden.
-- CREATE POLICY "Public can view non-hidden projects" ON projects FOR SELECT USING (is_hidden = FALSE);
-- (This might conflict with existing policies, we'll need to check existing policies or just use application logic for filtering first)

-- RLS for reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can create a report
CREATE POLICY "Authenticated users can create reports" 
ON reports FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = reporter_id);

-- Only admins can view reports (We'll assume specific admin Logic or just allow service_role for now)
-- If we don't have an "admin" role in Supabase yet, we can skip RLS for SELECT for now or allow public insert/private select.
