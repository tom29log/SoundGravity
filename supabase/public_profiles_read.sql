-- Allow public read access to profiles
-- This is necessary for public profile pages to function
drop policy if exists "Public profiles are viewable by everyone" on profiles;

create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

-- Ensure RLS is enabled (it should be, but good to confirm)
alter table profiles enable row level security;
