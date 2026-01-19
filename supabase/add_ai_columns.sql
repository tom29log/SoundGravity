-- projects 테이블에 AI 생성 여부 및 저작권 확인 컬럼 추가
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ai_tool_used TEXT,
ADD COLUMN IF NOT EXISTS copyright_confirmed BOOLEAN DEFAULT FALSE;

-- 주석 추가 (선택 사항)
COMMENT ON COLUMN public.projects.is_ai_generated IS 'AI 도구를 사용하여 생성된 음원인지 여부';
COMMENT ON COLUMN public.projects.ai_tool_used IS '사용된 AI 도구 이름 (Suno, Udio 등)';
COMMENT ON COLUMN public.projects.copyright_confirmed IS '업로더가 저작권 문제 없음을 확인했는지 여부';
