-- CreateTable
CREATE TABLE "spis_potentials" (
    "id" SERIAL NOT NULL,
    "env" TEXT NOT NULL,
    "res" TEXT NOT NULL,
    "dn" TEXT NOT NULL,
    "node0_mat" TEXT NOT NULL,
    "node1_mat" TEXT NOT NULL,
    "node" INTEGER NOT NULL,
    "av_pot" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "spis_potentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "spis_potentials_node0_mat_node1_mat_res_node_dn_idx" ON "spis_potentials"("node0_mat", "node1_mat", "res", "node", "dn");
