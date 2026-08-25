-- AlterTable: Publication 에 분류(category) 컬럼 추가 (idempotent)
-- 값: 'SCI'(SCI 논문/Journal) | 'OTHER'(기타 Publication) | 'CONFERENCE'(학회 초록/Conference)
ALTER TABLE "Publication" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'SCI';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_publication_category" ON "Publication"("category");
