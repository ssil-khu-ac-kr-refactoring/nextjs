import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

export async function PUT(req: Request, context: any) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const id = parseInt(context.params.id, 10);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }
    const body = await req.json();
    const { name, slug, description, order } = body ?? {};

    const updatedTab = await prisma.boardTab.update({
      where: { id },
      data: {
        name: typeof name === 'string' ? name : undefined,
        slug: typeof slug === 'string' ? slug : undefined,
        description: typeof description === 'string' ? description : undefined,
        order: typeof order === 'number' ? order : undefined,
      },
    });

    return NextResponse.json(updatedTab);
  } catch (error) {
    console.error('Error updating board tab:', error);
    return NextResponse.json({ error: 'Failed to update board tab' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: any) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const id = parseInt(context.params.id, 10);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }
    await prisma.boardTab.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting board tab:', error);
    return NextResponse.json({ error: 'Failed to delete board tab' }, { status: 500 });
  }
}
