import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';
import { getSpisDataset, isSpisDatasetId } from '@/lib/spis/datasets';
import { parseSpisImport } from '@/lib/spis/importData';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const datasets = await prisma.spisDataset.findMany({
    orderBy: { id: 'asc' },
    include: { _count: { select: { potentials: true } } },
  });
  return NextResponse.json(datasets.map(({ _count, ...dataset }) => ({
    ...dataset,
    actualRowCount: _count.potentials,
  })));
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const form = await req.formData();
    const file = form.get('file');
    const datasetId = form.get('datasetId');
    const mode = form.get('mode');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required.' }, { status: 400 });
    }
    if (!isSpisDatasetId(datasetId)) {
      return NextResponse.json({ error: 'A valid target dataset is required.' }, { status: 400 });
    }
    if (mode !== 'validate' && mode !== 'replace') {
      return NextResponse.json({ error: 'Mode must be validate or replace.' }, { status: 400 });
    }

    let parsed;
    try {
      parsed = await parseSpisImport(file, datasetId);
    } catch (validationError) {
      const message = validationError instanceof Error ? validationError.message : 'File validation failed.';
      return NextResponse.json({ error: message }, { status: 422 });
    }
    if (parsed.errors.length > 0) {
      return NextResponse.json(
        { error: 'File validation failed.', errors: parsed.errors, summary: parsed.summary },
        { status: 422 },
      );
    }
    if (mode === 'validate') {
      return NextResponse.json({ mode, summary: parsed.summary });
    }
    if (form.get('confirmation') !== `REPLACE_${datasetId}`) {
      return NextResponse.json({ error: 'Dataset replacement confirmation is required.' }, { status: 400 });
    }

    const definition = getSpisDataset(datasetId);
    await prisma.$transaction(async (tx) => {
      await tx.spisDataset.upsert({
        where: { id: datasetId },
        create: {
          id: datasetId,
          displayName: definition.label,
          description: definition.description,
        },
        update: {},
      });
      await tx.spisPotential.deleteMany({ where: { datasetId } });
      for (let index = 0; index < parsed.payload.length; index += 500) {
        await tx.spisPotential.createMany({ data: parsed.payload.slice(index, index + 500) });
      }
      await tx.spisDataset.update({
        where: { id: datasetId },
        data: {
          rowCount: parsed.summary.validRows,
          environmentCount: parsed.summary.environmentCount,
          materialCount: parsed.summary.materialCount,
          potentialMin: parsed.summary.potentialMin,
          potentialMax: parsed.summary.potentialMax,
        },
      });
    }, { timeout: 120_000 });

    return NextResponse.json({ mode, inserted: parsed.payload.length, summary: parsed.summary });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Import failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
