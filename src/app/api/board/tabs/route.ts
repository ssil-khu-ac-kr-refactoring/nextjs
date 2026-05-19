import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

export async function GET() {
  try {
    const tabs = await prisma.boardTab.findMany({
      orderBy: { order: 'asc' },
    });
    return NextResponse.json(tabs);
  } catch (error) {
    console.error('Error fetching board tabs:', error);
    return NextResponse.json({ error: 'Failed to fetch board tabs' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { name, slug, description, order } = body ?? {};

    if (!name || typeof name !== 'string' || !slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const newTab = await prisma.boardTab.create({
      data: {
        name,
        slug,
        description: typeof description === 'string' ? description : null,
        order: typeof order === 'number' ? order : 0,
      },
    });

    return NextResponse.json(newTab);
  } catch (error) {
    console.error('Error creating board tab:', error);
    return NextResponse.json({ error: 'Failed to create board tab' }, { status: 500 });
  }
}
