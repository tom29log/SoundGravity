-- Add user_id to projects table
alter table public.projects 
add column if not exists user_id uuid references auth.users on delete cascade;

-- Backfill existing projects (optional: assign to current user if needed, or leave null)
-- For clear segregation, better to leave null or assign manually later. 
-- But newly created projects will have user_id.

-- Update RLS Policies for Projects
drop policy if exists "Allow public read access" on public.projects;
drop policy if exists "Allow authenticated insert" on public.projects;
drop policy if exists "Allow authenticated delete" on public.projects;

-- New Policies
-- Public can still view (read-only) for the Interactive Viewer
create policy "Public read access" on public.projects for select using (true);

-- Authenticated users can only INSERT their own projects
create policy "Users can populate own project" on public.projects 
for insert with check (auth.uid() = user_id);

-- Authenticated users can only UPDATE/DELETE their own projects
create policy "Users can delete own project" on public.projects 
for delete using (auth.uid() = user_id);

create policy "Users can update own project" on public.projects 
for update using (auth.uid() = user_id);
