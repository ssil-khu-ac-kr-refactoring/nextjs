import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import { requireAdmin } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

const UPLOAD_PATH = process.env.UPLOAD_PATH;

export async function DELETE(_request: Request, context: any) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  if (!UPLOAD_PATH) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const { id } = context.params as { id: string };

  try {
    const numId = Number(id);
    if (!Number.isFinite(numId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const image = await prisma.sliderImage.findUnique({ where: { id: numId } });
    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const relativePath = path.basename(
      image.imageUrl.replace(/^\/?api\/files\//, "")
    );
    const oldFilePath = path.join(UPLOAD_PATH, relativePath);
    const resolvedOld = path.resolve(oldFilePath);
    const resolvedRoot = path.resolve(UPLOAD_PATH);

    if (resolvedOld.startsWith(resolvedRoot + path.sep)) {
      const dirname = path.dirname(resolvedOld);
      const ext = path.extname(resolvedOld);
      const basename = path.basename(resolvedOld, ext);
      const newFilePath = path.join(dirname, `deleted-${basename}${ext}`);
      try {
        await fs.rename(resolvedOld, newFilePath);
      } catch (fileError: any) {
        console.warn("File not renamed:", fileError?.message);
      }
    }

    await prisma.sliderImage.delete({ where: { id: numId } });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error(`Error deleting slider image with id: ${id}`, error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete slider image" }, { status: 500 });
  }
}
