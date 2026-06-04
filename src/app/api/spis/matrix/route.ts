import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await prisma.potentialMatrix.findMany();
  // Strip id → { form, node0Mat, potentials }[]
  const data = rows.map(({ id, ...r }) => r);
  return NextResponse.json(data);
}
