import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

export async function GET(req: Request, context: any) {
  try {
    const post = await prisma.boardPost.findUnique({
      where: { id: context.params.id },
      include: { tab: true },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

export async function PUT(req: Request, context: any) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { title, description, imageUrl, tabId, publishedAt } = body ?? {};

    const updated = await prisma.boardPost.update({
      where: { id: context.params.id },
      data: {
        title: typeof title === 'string' ? title : undefined,
        description: typeof description === 'string' ? description : undefined,
        imageUrl: typeof imageUrl === 'string' ? imageUrl : undefined,
        tabId: tabId !== undefined ? Number(tabId) : undefined,
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: any) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    await prisma.boardPost.delete({ where: { id: context.params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
