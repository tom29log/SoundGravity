-- Create a table for public profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check ((select auth.uid()) = id);

create policy "Users can update own profile." on public.profiles
  for update using ((select auth.uid()) = id);

-- Set up Storage for Avatars
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;

create policy "Avatar images are publicly accessible." on storage.objects
  for select using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar." on storage.objects
  for insert with check ( bucket_id = 'avatars' );

create policy "Anyone can update an avatar." on storage.objects
  for update with check ( bucket_id = 'avatars' );
