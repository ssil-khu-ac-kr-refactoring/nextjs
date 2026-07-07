-- Runs at container start via prisma db execute (idempotent).
INSERT INTO "Outcome" ("id","slug","title","description","published","order","createdAt","updatedAt")
VALUES ('outcome_satellite_surface_charging','satellite-surface-charging','Satellite Surface Charging','Satellite surface charging potential - 2D/3D map with OVATION aurora',true,999,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

-- SPIS 항목은 Outcomes 리스트 맨 아래에 배치 (관리자가 바꾸면 유지됨: 0일 때만 이동)
UPDATE "Outcome" SET "order"=999 WHERE "slug"='satellite-surface-charging' AND "order"=0;
