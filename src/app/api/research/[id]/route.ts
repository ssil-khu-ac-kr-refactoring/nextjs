import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

export async function GET(_req: Request, context: any) {
  try {
    const { id } = context.params;
    const item = await prisma.research.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(item);
  } catch (e) {
    console.error('GET /api/research/[id] error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request, context: any) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = context.params;
    const body = await req.json();
    const { title, description, contentHtml, imageUrl, status, startDate, endDate } = body ?? {};
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const updated = await prisma.research.update({
      where: { id },
      data: {
        title,
        description: typeof description === 'string' ? description : null,
        contentHtml: typeof contentHtml === 'string' ? contentHtml : null,
        imageUrl: typeof imageUrl === 'string' ? imageUrl : null,
        status: status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    console.error('PUT /api/research/[id] error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: any) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = context.params;
    await prisma.research.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (e: any) {
    if (e?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    console.error('DELETE /api/research/[id] error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
