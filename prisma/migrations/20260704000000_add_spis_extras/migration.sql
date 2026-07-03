-- 인식되지 않은 엑셀 컬럼을 담는 JSON 필드 (멱등)
ALTER TABLE "spis_potentials" ADD COLUMN IF NOT EXISTS "extras" JSONB;
