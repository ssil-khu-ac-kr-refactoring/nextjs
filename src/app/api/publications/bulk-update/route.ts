import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';
import { validatePublicationUpdate } from '@/lib/publications';

const MAX_UPDATE_ROWS = 1000;

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const rows = body?.rows;
    if (!Array.isArray(rows) || rows.length === 0 || rows.length > MAX_UPDATE_ROWS) {
      return NextResponse.json(
        { error: `rows must contain between 1 and ${MAX_UPDATE_ROWS} publications.` },
        { status: 400 },
      );
    }

    const validatedRows = rows.map((row, index) => ({
      row: index + 1,
      ...validatePublicationUpdate(row),
    }));
    const idCounts = new Map<number, number>();
    validatedRows.forEach(({ data }) => {
      if (Number.isSafeInteger(data.id)) idCounts.set(data.id, (idCounts.get(data.id) ?? 0) + 1);
    });
    validatedRows.forEach((row) => {
      if ((idCounts.get(row.data.id) ?? 0) > 1) row.errors.push('Duplicate ID within this request.');
    });

    const formatErrors = () => validatedRows
      .filter(({ errors }) => errors.length > 0)
      .map(({ row, errors }) => ({ row, errors }));
    if (formatErrors().length > 0) {
      return NextResponse.json(
        { error: 'Bulk update contains invalid rows.', rows: formatErrors() },
        { status: 400 },
      );
    }

    const existingPublications = await prisma.publication.findMany({
      where: { id: { in: validatedRows.map(({ data }) => data.id) } },
    });
    const existingById = new Map(existingPublications.map((publication) => [publication.id, publication]));
    validatedRows.forEach((row) => {
      if (!existingById.has(row.data.id)) row.errors.push('Publication ID was not found.');
    });
    if (formatErrors().length > 0) {
      return NextResponse.json(
        { error: 'Bulk update contains invalid rows.', rows: formatErrors() },
        { status: 400 },
      );
    }

    const changedRows = validatedRows.filter(({ data }) => {
      const existing = existingById.get(data.id)!;
      return existing.year !== data.year ||
        (data.month !== undefined && (existing.month ?? null) !== data.month) ||
        (data.venue !== undefined && (existing.venue ?? null) !== data.venue) ||
        (data.url !== undefined && (existing.url ?? null) !== data.url) ||
        (data.pdfUrl !== undefined && (existing.pdfUrl ?? null) !== data.pdfUrl) ||
        existing.category !== data.category;
    });

    if (changedRows.length > 0) {
      await prisma.$transaction(
        changedRows.map(({ data }) =>
          prisma.publication.update({
            where: { id: data.id },
            data: {
              year: data.year,
              month: data.month,
              venue: data.venue,
              url: data.url,
              pdfUrl: data.pdfUrl,
              category: data.category,
            },
          }),
        ),
      );
    }

    return NextResponse.json({ updated: changedRows.length, skipped: rows.length - changedRows.length });
  } catch (error) {
    console.error('POST /api/publications/bulk-update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
