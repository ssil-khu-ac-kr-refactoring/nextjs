-- AlterTable: add optional environment parameters to SPIS potentials
-- (client's real data format: cond_Solar, Kp, e_n, e_T, i_n, i_T, type).
-- Idempotent (IF NOT EXISTS) and nullable — safe on existing data.
ALTER TABLE "spis_potentials" ADD COLUMN IF NOT EXISTS "cond_solar" TEXT;
ALTER TABLE "spis_potentials" ADD COLUMN IF NOT EXISTS "kp" TEXT;
ALTER TABLE "spis_potentials" ADD COLUMN IF NOT EXISTS "e_n" DOUBLE PRECISION;
ALTER TABLE "spis_potentials" ADD COLUMN IF NOT EXISTS "e_t" DOUBLE PRECISION;
ALTER TABLE "spis_potentials" ADD COLUMN IF NOT EXISTS "i_n" DOUBLE PRECISION;
ALTER TABLE "spis_potentials" ADD COLUMN IF NOT EXISTS "i_t" DOUBLE PRECISION;
ALTER TABLE "spis_potentials" ADD COLUMN IF NOT EXISTS "form" TEXT;
