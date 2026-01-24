-- Add stems column to projects table
-- Stems JSON structure: { "vocal": "url", "drum": "url", "bass": "url", "others": "url" }
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS stems JSONB DEFAULT '{}'::jsonb;
