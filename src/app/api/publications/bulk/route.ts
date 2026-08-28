import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';
import { validatePublicationImport } from '@/lib/publications';

const MAX_IMPORT_ROWS = 1000;

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const rows = body?.rows;

    if (!Array.isArray(rows) || rows.length === 0 || rows.length > MAX_IMPORT_ROWS) {
      return NextResponse.json(
        { error: `rows must contain between 1 and ${MAX_IMPORT_ROWS} publications.` },
        { status: 400 },
      );
    }

    const validatedRows = rows.map((row, index) => ({
      row: index + 1,
      ...validatePublicationImport(row),
    }));
    const invalidRows = validatedRows
      .filter(({ errors }) => errors.length > 0)
      .map(({ row, errors }) => ({ row, errors }));

    if (invalidRows.length > 0) {
      return NextResponse.json(
        { error: 'Bulk import contains invalid rows.', rows: invalidRows },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction((transaction) =>
      transaction.publication.createMany({
        data: validatedRows.map(({ data }) => data),
      }),
    );

    return NextResponse.json({ imported: result.count }, { status: 201 });
  } catch (error) {
    console.error('POST /api/publications/bulk error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
