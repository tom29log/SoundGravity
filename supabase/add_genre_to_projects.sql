-- Add genre column to projects table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='projects' AND column_name='genre'
    ) THEN
        ALTER TABLE public.projects ADD COLUMN genre text;
    END IF;
END $$;
