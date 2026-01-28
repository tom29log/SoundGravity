-- Function to check report count and auto-hide
CREATE OR REPLACE FUNCTION check_project_report_threshold()
RETURNS TRIGGER AS $$
DECLARE
    report_count INTEGER;
    THRESHOLD CONSTANT INTEGER := 5; -- 5회 이상 신고 시 자동 숨김
BEGIN
    -- 현재 프로젝트의 신고 횟수 조회
    SELECT COUNT(*) INTO report_count
    FROM reports
    WHERE project_id = NEW.project_id;

    -- 임계값 초과 시 프로젝트 숨김 처리
    IF report_count >= THRESHOLD THEN
        UPDATE projects
        SET is_hidden = TRUE
        WHERE id = NEW.project_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger definition
DROP TRIGGER IF EXISTS on_report_added ON reports;

CREATE TRIGGER on_report_added
AFTER INSERT ON reports
FOR EACH ROW
EXECUTE FUNCTION check_project_report_threshold();
