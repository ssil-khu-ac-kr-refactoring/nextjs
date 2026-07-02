import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

// 이 slug 항목은 /outcome 에서 SPIS 시각화로 특수 렌더링되므로 삭제/slug 변경을 막는다.
const PROTECTED_SLUG = 'satellite-surface-charging';

export async function GET(_req: Request, context: any) {
  try {
    const { id } = context.params;
    const item = await prisma.outcome.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(item);
  } catch (e) {
    console.error('GET /api/outcome/[id] error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request, context: any) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = context.params;
    const body = await req.json();
    const { slug, title, description, contentHtml, imageUrl, published, order } = body ?? {};
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const existing = await prisma.outcome.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const nextSlug = typeof slug === 'string' && slug.trim() ? slug.trim() : existing.slug;
    if (existing.slug === PROTECTED_SLUG && nextSlug !== PROTECTED_SLUG) {
      return NextResponse.json(
        { error: `'${PROTECTED_SLUG}' 항목은 SPIS 시각화로 특수 렌더링되므로 slug 를 변경할 수 없습니다.` },
        { status: 400 },
      );
    }

    const updated = await prisma.outcome.update({
      where: { id },
      data: {
        slug: nextSlug,
        title,
        description: typeof description === 'string' ? description : null,
        contentHtml: typeof contentHtml === 'string' ? contentHtml : null,
        imageUrl: typeof imageUrl === 'string' ? imageUrl : null,
        published: typeof published === 'boolean' ? published : undefined,
        order: typeof order === 'number' ? order : undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (e?.code === 'P2002') return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    console.error('PUT /api/outcome/[id] error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// 부분 업데이트 (published 토글, order 변경 등)
export async function PATCH(req: Request, context: any) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = context.params;
    const body = await req.json();
    const { published, order } = body ?? {};

    const updated = await prisma.outcome.update({
      where: { id },
      data: {
        published: typeof published === 'boolean' ? published : undefined,
        order: typeof order === 'number' ? order : undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    console.error('PATCH /api/outcome/[id] error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: any) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = context.params;
    const existing = await prisma.outcome.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing.slug === PROTECTED_SLUG) {
      return NextResponse.json(
        { error: `'${PROTECTED_SLUG}' 항목은 SPIS 시각화로 특수 렌더링되므로 삭제할 수 없습니다. 숨기려면 게시(published)를 끄세요.` },
        { status: 400 },
      );
    }
    await prisma.outcome.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (e: any) {
    if (e?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    console.error('DELETE /api/outcome/[id] error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
