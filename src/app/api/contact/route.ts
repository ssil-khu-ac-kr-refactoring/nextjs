import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';
export const runtime = "nodejs";

const DEFAULT_CONTACT = {
  labNameKo: "우주과학탐재체연구실",
  labNameEn: "Space Science Instrument Laboratory",
  addressKo:
    "(우)17104 경기도 용인시 기흥구 덕영대로 1732\n경희대학교 국제캠퍼스 천문대",
  addressEn:
    "Kyung Hee University Global Campus Observatory\n1732 Deogyeong-daero, Giheung-gu, Yongin-si, Gyeonggi-do 17104, Korea",
  mapEmbedUrl: "https://www.google.com/maps/embed?pb=",
};

export async function GET() {
  try {
    const row = await prisma.contact.findUnique({ where: { id: 1 } });
    if (!row) {
      const created = await prisma.contact.create({
        data: { id: 1, ...DEFAULT_CONTACT },
      });
      return NextResponse.json(created, { status: 200 });
    }
    return NextResponse.json(row, { status: 200 });
  } catch (e) {
    console.error("[GET /api/contact]", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));

    const data = {
      labNameKo: String(body.labNameKo ?? DEFAULT_CONTACT.labNameKo),
      labNameEn: String(body.labNameEn ?? DEFAULT_CONTACT.labNameEn),
      addressKo: String(body.addressKo ?? DEFAULT_CONTACT.addressKo),
      addressEn: String(body.addressEn ?? DEFAULT_CONTACT.addressEn),
      mapEmbedUrl: String(body.mapEmbedUrl ?? DEFAULT_CONTACT.mapEmbedUrl),
    };

    await prisma.contact.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("[PUT /api/contact]", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
