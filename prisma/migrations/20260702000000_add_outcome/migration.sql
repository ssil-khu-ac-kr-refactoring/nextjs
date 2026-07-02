-- CreateTable (idempotent: 재시도/부분적용에도 안전)
CREATE TABLE IF NOT EXISTS "Outcome" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "contentHtml" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Outcome_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Outcome_slug_key" ON "Outcome"("slug");

-- Seed: Satellite Surface Charging (ON CONFLICT 로 중복 안전)
INSERT INTO "Outcome" ("id","slug","title","description","published","order","createdAt","updatedAt")
VALUES ('outcome_satellite_surface_charging','satellite-surface-charging','Satellite Surface Charging','Satellite surface charging potential - 2D/3D map with OVATION aurora',true,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
