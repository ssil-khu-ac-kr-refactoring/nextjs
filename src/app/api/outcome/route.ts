import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// GET all — admin sees everything, public sees published only
export async function GET() {
  try {
    const auth = await requireAdmin();
    const items = await prisma.outcome.findMany({
      where: auth.ok ? undefined : { published: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return NextResponse.json(items);
  } catch (e) {
    console.error('GET /api/outcome error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { slug, title, description, contentHtml, imageUrl, published, order } = body ?? {};

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const finalSlug = typeof slug === 'string' && slug.trim() ? slugify(slug) : slugify(title);
    if (!finalSlug) {
      return NextResponse.json({ error: 'Slug could not be derived — please provide one' }, { status: 400 });
    }

    const created = await prisma.outcome.create({
      data: {
        slug: finalSlug,
        title,
        description: typeof description === 'string' ? description : null,
        contentHtml: typeof contentHtml === 'string' ? contentHtml : null,
        imageUrl: typeof imageUrl === 'string' ? imageUrl : null,
        published: typeof published === 'boolean' ? published : true,
        order: typeof order === 'number' ? order : 0,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }
    console.error('POST /api/outcome error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
