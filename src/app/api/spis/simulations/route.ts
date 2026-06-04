import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Public read: all SPIS average-potential rows (camelCase, id stripped).
export async function GET() {
  const rows = await prisma.spisPotential.findMany();
  const data = rows.map(({ id, ...r }) => r);
  return NextResponse.json(data);
}
