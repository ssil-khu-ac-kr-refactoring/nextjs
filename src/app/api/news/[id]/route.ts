import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, context: any) {
  try {
    const id = context?.params?.id as string;
    if (!id) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

    const item = await prisma.news.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: 'News not found' }, { status: 404 });

    return NextResponse.json(item);
  } catch (err) {
    console.error('Error fetching news by id:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request, context: any) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const id = context?.params?.id as string;
    if (!id) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

    const body = await req.json();
    const { title, description, imageUrl, publishedAt } = body ?? {};

    if (!title || !description || typeof title !== 'string' || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const updated = await prisma.news.update({
      where: { id },
      data: {
        title,
        description,
        imageUrl: typeof imageUrl === 'string' ? imageUrl : null,
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'News not found' }, { status: 404 });
    }
    console.error('Error updating news:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: any) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const id = context?.params?.id as string;
    if (!id) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

    await prisma.news.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'News not found' }, { status: 404 });
    }
    console.error('Error deleting news:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
