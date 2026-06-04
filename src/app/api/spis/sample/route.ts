import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';
import { generateSampleData, generatePotentialMatrix } from '@/lib/spis/excelParser';

export const runtime = 'nodejs';

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const sim = generateSampleData();        // SimulationRow[] (camelCase)
    const matrix = generatePotentialMatrix(); // PotentialResult[]
    await prisma.simulationRow.deleteMany({});
    await prisma.potentialMatrix.deleteMany({});
    const simData = sim.map((r) => ({
      form: r.form,
      node0Mat: r.node0Mat,
      timeMode: r.timeMode,
      lat: r.lat,
      lon: r.lon,
      avPot: r.avPot,
      nth: r.nth,
      tth: r.tth,
      ne: r.ne,
      te: r.te,
      ni: r.ni,
      ti: r.ti,
      alt: r.alt,
      sey: r.sey,
      mpd: r.mpd,
      pey: r.pey,
      ipe: r.ipe,
      pee: r.pee,
      msey: r.msey,
      buc: r.buc,
      sre: r.sre,
    }));
    for (let i = 0; i < simData.length; i += 500) {
      await prisma.simulationRow.createMany({ data: simData.slice(i, i + 500) });
    }
    const matrixData = matrix.map((m) => ({
      form: m.form,
      node0Mat: m.node0Mat,
      potentials: m.potentials as any,
    }));
    if (matrixData.length) await prisma.potentialMatrix.createMany({ data: matrixData });
    return NextResponse.json({ rows: simData.length, matrix: matrixData.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'sample load failed' }, { status: 500 });
  }
}
