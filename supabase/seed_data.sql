-- Generating Sample Data
-- This script finds the first user in auth.users and creates 7 sample projects for them.

DO $$
DECLARE
  test_user_id uuid;
BEGIN
  -- 1. Select the first user found in auth.users
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;

  IF test_user_id IS NOT NULL THEN
    
    -- 2. Ensure a profile exists for this user
    INSERT INTO public.profiles (id, username, avatar_url, followers_count)
    VALUES (
        test_user_id, 
        'Demo Artist', 
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
        1240
    )
    ON CONFLICT (id) DO UPDATE 
    SET username = 'Demo Artist',
        avatar_url = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80';

    -- 3. Insert 7 Sample Projects
    INSERT INTO public.projects (title, image_url, audio_url, user_id, genre, views)
    VALUES
    (
        'Midnight Jazz', 
        'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80', 
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 
        test_user_id, 
        'Jazz', 
        120
    ),
    (
        'Urban Echoes', 
        'https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=800&q=80', 
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 
        test_user_id, 
        'Lo-Fi', 
        450
    ),
    (
        'Neon Nights', 
        'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=800&q=80', 
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 
        test_user_id, 
        'Synthwave', 
        890
    ),
    (
        'Deep Blue', 
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80', 
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', 
        test_user_id, 
        'Ambient', 
        34
    ),
    (
        'Forest Rain', 
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80', 
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', 
        test_user_id, 
        'Nature', 
        1500
    ),
    (
        'Cyber Pulse', 
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80', 
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', 
        test_user_id, 
        'Techno', 
        670
    ),
    (
        'Golden Hour', 
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80', 
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3', 
        test_user_id, 
        'Pop', 
        230
    );

  ELSE
    RAISE NOTICE 'No users found in auth.users. Please sign up at least one user first.';
  END IF;
END $$;
