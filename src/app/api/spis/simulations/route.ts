import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await prisma.simulationRow.findMany();
  // Prisma already returns camelCase fields matching SimulationRow; strip id.
  const data = rows.map(({ id, ...r }) => r);
  return NextResponse.json(data);
}
