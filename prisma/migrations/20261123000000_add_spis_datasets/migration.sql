-- Add dataset metadata first so the new required dataset_id foreign key can
-- safely default every existing SPIS row to DMSP_ONLY without changing row IDs.
CREATE TABLE "spis_datasets" (
    "id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "row_count" INTEGER NOT NULL DEFAULT 0,
    "environment_count" INTEGER NOT NULL DEFAULT 0,
    "material_count" INTEGER NOT NULL DEFAULT 0,
    "potential_min" DOUBLE PRECISION,
    "potential_max" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "spis_datasets_pkey" PRIMARY KEY ("id")
);

INSERT INTO "spis_datasets" (
    "id", "display_name", "description", "row_count", "environment_count",
    "material_count", "potential_min", "potential_max"
)
SELECT
    'DMSP_ONLY',
    'DMSP-only',
    'High-energy plasma conditions derived from DMSP SSJ/5 observations.',
    COUNT(*)::INTEGER,
    COUNT(DISTINCT "env")::INTEGER,
    COUNT(DISTINCT "node0_mat")::INTEGER,
    MIN("av_pot"),
    MAX("av_pot")
FROM "spis_potentials";

INSERT INTO "spis_datasets" ("id", "display_name", "description")
VALUES (
    'DMSP_IRI2016',
    'DMSP + IRI2016',
    'DMSP-based high-energy plasma with IRI2016 background ionospheric plasma.'
);

ALTER TABLE "spis_potentials"
    ADD COLUMN "dataset_id" TEXT NOT NULL DEFAULT 'DMSP_ONLY',
    ADD COLUMN "env_id" TEXT,
    ADD COLUMN "dmsp_e_n" DOUBLE PRECISION,
    ADD COLUMN "dmsp_e_t" DOUBLE PRECISION,
    ADD COLUMN "dmsp_i_n" DOUBLE PRECISION,
    ADD COLUMN "dmsp_i_t" DOUBLE PRECISION,
    ADD COLUMN "iri_e_n" DOUBLE PRECISION,
    ADD COLUMN "iri_e_t" DOUBLE PRECISION,
    ADD COLUMN "iri_i_n" DOUBLE PRECISION,
    ADD COLUMN "iri_i_t" DOUBLE PRECISION;

CREATE INDEX "spis_potentials_dataset_id_idx" ON "spis_potentials"("dataset_id");
CREATE INDEX "spis_potentials_dataset_id_env_id_idx" ON "spis_potentials"("dataset_id", "env_id");

ALTER TABLE "spis_potentials"
    ADD CONSTRAINT "spis_potentials_dataset_id_fkey"
    FOREIGN KEY ("dataset_id") REFERENCES "spis_datasets"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
