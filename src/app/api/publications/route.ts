import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

export async function GET() {
  const pubs = await prisma.publication.findMany({
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });
  return NextResponse.json(pubs);
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { title, authors, venue, year, month, url, pdfUrl } = body ?? {};

    if (!title || typeof title !== 'string' || !authors || typeof authors !== 'string' || typeof year !== 'number') {
      return NextResponse.json({ error: 'title, authors, year are required' }, { status: 400 });
    }

    const created = await prisma.publication.create({
      data: {
        title,
        authors,
        venue: typeof venue === 'string' ? venue : null,
        year,
        month: typeof month === 'number' ? month : null,
        url: typeof url === 'string' ? url : null,
        pdfUrl: typeof pdfUrl === 'string' ? pdfUrl : null,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error('POST /api/publications error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
