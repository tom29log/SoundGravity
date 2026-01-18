-- Create projects table
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  image_url text not null,
  audio_url text not null,
  target_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.projects enable row level security;

-- Policies for projects table
create policy "Allow public read access"
on public.projects
for select
to public
using (true);

create policy "Allow authenticated insert"
on public.projects
for insert
to authenticated
with check (true);

create policy "Allow authenticated update"
on public.projects
for update
to authenticated
using (true);

create policy "Allow authenticated delete"
on public.projects
for delete
to authenticated
using (true);

-- Create storage bucket 'assets' if it doesn't exist
-- Note: This insert might fail if bucket exists, usually done via UI or this specific SQL
insert into storage.buckets (id, name, public) 
values ('assets', 'assets', true)
on conflict (id) do nothing;

-- Storage policies
create policy "Give public access to assets"
on storage.objects
for select
to public
using ( bucket_id = 'assets' );

create policy "Enable authenticated uploads"
on storage.objects
for insert
to authenticated
with check ( bucket_id = 'assets' );

create policy "Enable authenticated updates"
on storage.objects
for update
to authenticated
using ( bucket_id = 'assets' );

create policy "Enable authenticated deletes"
on storage.objects
for delete
to authenticated
using ( bucket_id = 'assets' );
