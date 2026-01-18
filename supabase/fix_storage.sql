-- Ensure "assets" bucket exists (optional, usually created by UI but good to check)
insert into storage.buckets (id, name, public)
values ('assets', 'assets', true)
on conflict (id) do update set public = true;

-- Remove valid public read policy if exists to recreate it cleanly
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Give me public access" on storage.objects;

-- Create explicitly open public read policy for 'assets'
create policy "Public Access Assets"
on storage.objects for select
using ( bucket_id = 'assets' );

-- Create authenticated insert (upload) policy (already seemingly working, but good to reinforce)
-- Note: User already uploads fine, so maybe skip insert policy to avoid conflict if already set.
-- Only fixing READ access here.

-- Also ensure 'avatars' is public
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

create policy "Public Access Avatars"
on storage.objects for select
using ( bucket_id = 'avatars' );
