import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tabId = searchParams.get('tabId');

    const posts = await prisma.boardPost.findMany({
      where: tabId ? { tabId: Number(tabId) } : {},
      include: { tab: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching board posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { title, description, imageUrl, tabId, publishedAt } = body ?? {};

    if (!title || typeof title !== 'string' || !tabId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newPost = await prisma.boardPost.create({
      data: {
        title,
        description: typeof description === 'string' ? description : '',
        imageUrl: typeof imageUrl === 'string' ? imageUrl : null,
        tabId: Number(tabId),
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
        published: true,
      },
    });

    return NextResponse.json(newPost);
  } catch (error) {
    console.error('Error creating board post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
