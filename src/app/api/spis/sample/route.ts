import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

export const runtime = 'nodejs';

// Admin-only: generate random SPIS potential data (no Excel needed) so the
// globe can be exercised end-to-end. Replaces whatever is in the table.
const NODE0 = ['AL2K', 'ALOX', 'GOLD', 'GOLD (2k)', 'KAPT', 'EPOX', 'Al2O3', 'CERS'];
const NODE1 = ['AL2K', 'KAPT'];
const RES = ['R0', 'R1'];
const NODES = [0, 1];
const DN = ['DAY', 'NGT'] as const;

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const data: {
      env: string; res: string; dn: string;
      node0Mat: string; node1Mat: string; node: number; avPot: number;
    }[] = [];
    let seed = 1;
    const rnd = () => {
      // deterministic pseudo-random so repeated demo loads are stable
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (const node0Mat of NODE0)
      for (const node1Mat of NODE1)
        for (const res of RES)
          for (const node of NODES)
            for (const dn of DN) {
              // night tends to charge more negative than day
              const base = dn === 'NGT' ? -12000 : -5000;
              const avPot = Math.round((base * (0.5 + rnd())) * 10) / 10;
              data.push({ env: 'AUR', res, dn, node0Mat, node1Mat, node, avPot });
            }

    await prisma.spisPotential.deleteMany({});
    for (let i = 0; i < data.length; i += 500) {
      await prisma.spisPotential.createMany({ data: data.slice(i, i + 500) });
    }
    return NextResponse.json({ rows: data.length, matrix: 0 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'sample load failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
