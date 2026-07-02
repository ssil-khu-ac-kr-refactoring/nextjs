-- CreateTable
CREATE TABLE "Outcome" (
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
CREATE UNIQUE INDEX "Outcome_slug_key" ON "Outcome"("slug");

-- Seed: Satellite Surface Charging (우측 상세에 현재 SPIS 화면을 렌더)
INSERT INTO "Outcome" ("id","slug","title","description","published","order","createdAt","updatedAt")
VALUES ('outcome_satellite_surface_charging','satellite-surface-charging','Satellite Surface Charging','위성 표면 대전(charging) 전위 분석 — 2D/3D 지도 및 OVATION 오로라','t',0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
