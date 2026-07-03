-- Runs at container start via prisma db execute (idempotent).
INSERT INTO "Outcome" ("id","slug","title","description","published","order","createdAt","updatedAt")
VALUES ('outcome_satellite_surface_charging','satellite-surface-charging','Satellite Surface Charging','Satellite surface charging potential - 2D/3D map with OVATION aurora',true,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
