import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

export async function GET(_req: NextRequest, { params }: any) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  const pub = await prisma.publication.findUnique({ where: { id } });
  if (!pub) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(pub);
}

export async function PUT(req: NextRequest, { params }: any) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  try {
    const body = await req.json();
    const { title, authors, venue, year, month, url, pdfUrl } = body ?? {};

    if (!title || typeof title !== 'string' || !authors || typeof authors !== 'string' || typeof year !== 'number') {
      return NextResponse.json({ error: 'title, authors, year are required' }, { status: 400 });
    }

    const updated = await prisma.publication.update({
      where: { id },
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
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    console.error('PUT /api/publications/[id] error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: any) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  try {
    await prisma.publication.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (e: any) {
    if (e?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    console.error('DELETE /api/publications/[id] error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
