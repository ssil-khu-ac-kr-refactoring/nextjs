import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

// GET all
export async function GET() {
  try {
    const items = await prisma.research.findMany({
      orderBy: [{ order: 'asc' }, { startDate: 'desc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json(items);
  } catch (e) {
    console.error('GET /api/research error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { title, description, contentHtml, imageUrl, status, startDate, endDate, order } = body ?? {};

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const created = await prisma.research.create({
      data: {
        title,
        description: typeof description === 'string' ? description : null,
        contentHtml: typeof contentHtml === 'string' ? contentHtml : null,
        imageUrl: typeof imageUrl === 'string' ? imageUrl : null,
        status: status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        order: typeof order === 'number' ? order : 0,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error('POST /api/research error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
