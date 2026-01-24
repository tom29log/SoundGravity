-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Allow users to delete their own projects
create policy "Users can delete their own projects"
on projects for delete
using ( auth.uid() = user_id );

-- Ensure users can view their own projects (if not already set)
create policy "Users can view their own projects"
on projects for select
using ( auth.uid() = user_id );
