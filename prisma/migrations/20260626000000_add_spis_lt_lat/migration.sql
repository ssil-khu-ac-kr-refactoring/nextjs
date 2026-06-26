-- AlterTable: add optional spatial dimension to SPIS potentials.
-- The client delivers position as Local Time (LT), converted to longitude at render time.
ALTER TABLE "spis_potentials" ADD COLUMN "lt" DOUBLE PRECISION;
ALTER TABLE "spis_potentials" ADD COLUMN "lat" DOUBLE PRECISION;
