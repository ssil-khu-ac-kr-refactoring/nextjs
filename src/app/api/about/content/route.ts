import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from '@/lib/api-auth';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let row = await prisma.aboutContent.findUnique({
      where: { page: "about" },
    });

    if (!row) {
      row = await prisma.aboutContent.create({
        data: {
          page: "about",
          data: { content: "<p>Welcome to About Page!</p>" },
        },
      });
    }

    return NextResponse.json(row.data);
  } catch (e) {
    console.error("[GET /api/about/content]", e);
    return NextResponse.json({ error: "Failed to load content" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const data = { content: typeof body?.content === 'string' ? body.content : "" };

    const updated = await prisma.aboutContent.upsert({
      where: { page: "about" },
      update: { data },
      create: { page: "about", data },
    });

    return NextResponse.json(updated.data);
  } catch (e) {
    console.error("[PUT /api/about/content]", e);
    return NextResponse.json({ error: "Failed to save content" }, { status: 500 });
  }
}
