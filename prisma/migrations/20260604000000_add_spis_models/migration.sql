-- CreateTable
CREATE TABLE "simulation_rows" (
    "id" SERIAL NOT NULL,
    "form" TEXT NOT NULL,
    "node0_mat" TEXT NOT NULL,
    "time_mode" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "av_pot" DOUBLE PRECISION NOT NULL,
    "nth" DOUBLE PRECISION NOT NULL,
    "tth" DOUBLE PRECISION NOT NULL,
    "ne" DOUBLE PRECISION NOT NULL,
    "te" DOUBLE PRECISION NOT NULL,
    "ni" DOUBLE PRECISION NOT NULL,
    "ti" DOUBLE PRECISION NOT NULL,
    "alt" DOUBLE PRECISION NOT NULL,
    "sey" DOUBLE PRECISION,
    "mpd" DOUBLE PRECISION,
    "pey" DOUBLE PRECISION,
    "ipe" DOUBLE PRECISION,
    "pee" DOUBLE PRECISION,
    "msey" DOUBLE PRECISION,
    "buc" DOUBLE PRECISION,
    "sre" DOUBLE PRECISION,

    CONSTRAINT "simulation_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "potential_matrix" (
    "id" SERIAL NOT NULL,
    "form" TEXT NOT NULL,
    "node0_mat" TEXT NOT NULL,
    "potentials" JSONB NOT NULL,

    CONSTRAINT "potential_matrix_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "simulation_rows_form_node0_mat_time_mode_idx" ON "simulation_rows"("form", "node0_mat", "time_mode");

-- CreateIndex
CREATE UNIQUE INDEX "potential_matrix_form_node0_mat_key" ON "potential_matrix"("form", "node0_mat");
