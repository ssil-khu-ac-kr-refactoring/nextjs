// app/api/research-nav/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const all = await prisma.research.findMany({
      orderBy: [{ order: 'asc' }, { startDate: 'desc' }, { createdAt: 'desc' }],
      select: { id: true, title: true, status: true },
    });

    // 상태를 페이지가 쓰는 카테고리명으로 매핑
    const buckets = { Current: [] as { title: string }[], Completed: [] as { title: string }[] };
    for (const r of all) {
      const cat = r.status === 'IN_PROGRESS' ? 'Current' : 'Completed';
      buckets[cat].push({ title: r.title });
    }

    // 드롭다운에 바로 쓸 형태로 가공 (각 카테고리 안에서 idx 부여)
    const payload: { label: string; href: string; cat: 'Current'|'Completed' }[] = [
      ...buckets.Current.map((r, idx) => ({ label: r.title, href: `/research?cat=Current&idx=${idx}`, cat: 'Current' as const })),
      ...buckets.Completed.map((r, idx) => ({ label: r.title, href: `/research?cat=Completed&idx=${idx}`, cat: 'Completed' as const })),
    ];

    return NextResponse.json(payload);
  } catch (e) {
    console.error('[research-nav]', e);
    return NextResponse.json([], { status: 200 });
  }
}
