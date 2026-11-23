import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_SPIS_DATASET, isSpisDatasetId } from '@/lib/spis/datasets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const INTERNAL_EXTRA_KEYS = new Set(['xmlfile', 'projectname']);

function sanitizeExtras(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  return Object.fromEntries(
    Object.entries(value).filter(([key]) => !INTERNAL_EXTRA_KEYS.has(key.toLowerCase().replace(/[\s_-]/g, ''))),
  );
}

// Public read is always scoped to one explicitly validated dataset. The default
// preserves the legacy DMSP-only behavior for existing callers.
export async function GET(req: Request) {
  const requested = new URL(req.url).searchParams.get('dataset') ?? DEFAULT_SPIS_DATASET;
  if (!isSpisDatasetId(requested)) {
    return NextResponse.json({ error: 'Invalid SPIS dataset.' }, { status: 400 });
  }
  const rows = await prisma.spisPotential.findMany({ where: { datasetId: requested } });
  const data = rows.map(({ id, extras, ...row }) => ({ ...row, extras: sanitizeExtras(extras) }));
  return NextResponse.json(data);
}
