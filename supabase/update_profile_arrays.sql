-- Migration to convert artist_type and primary_genre to arrays

-- 1. Create temporary columns
ALTER TABLE public.profiles ADD COLUMN artist_type_new text[];
ALTER TABLE public.profiles ADD COLUMN primary_genre_new text[];

-- 2. Migrate data
-- Convert existing single values to single-element arrays
UPDATE public.profiles 
SET artist_type_new = CASE 
    WHEN artist_type IS NOT NULL THEN ARRAY[artist_type]
    ELSE NULL 
END,
primary_genre_new = CASE 
    WHEN primary_genre IS NOT NULL THEN ARRAY[primary_genre]
    ELSE NULL 
END;

-- 3. Drop old columns
ALTER TABLE public.profiles DROP COLUMN artist_type;
ALTER TABLE public.profiles DROP COLUMN primary_genre;

-- 4. Rename new columns to old names
ALTER TABLE public.profiles RENAME COLUMN artist_type_new TO artist_type;
ALTER TABLE public.profiles RENAME COLUMN primary_genre_new TO primary_genre;
