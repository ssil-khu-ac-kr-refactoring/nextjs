import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

export const runtime = 'nodejs';
const UPLOAD_PATH = process.env.UPLOAD_PATH;

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif', '.pdf']);
const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff',
  'application/pdf',
]);

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  if (!UPLOAD_PATH) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  try {
    const form = await request.formData();
    const file = form.get('file') as File | null;
    const ownerType = (form.get('ownerType') as string | null) ?? 'MISC';
    const ownerId = form.get('ownerId') as string | null;
    const tag = (form.get('tag') as string | null) ?? null;

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 413 });
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return NextResponse.json({ error: 'Unsupported file extension' }, { status: 415 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 안전한 파일명: 확장자만 보존, 본체는 ASCII 영숫자/대시/언더스코어만
    const baseRaw = path.basename(file.name, ext).replace(/[^\w\-]/g, '_').slice(0, 64) || 'file';
    const filename = `${Date.now()}-${baseRaw}${ext}`;

    // 경로 escape 방지: join 후 resolve된 경로가 UPLOAD_PATH 하위인지 확인
    const savePath = path.join(UPLOAD_PATH, filename);
    const resolvedSave = path.resolve(savePath);
    const resolvedRoot = path.resolve(UPLOAD_PATH);
    if (!resolvedSave.startsWith(resolvedRoot + path.sep)) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    await fs.writeFile(resolvedSave, buffer);

    const url = `/api/files/${filename}`;

    if (ownerId && (ownerType === 'RESEARCH' || ownerType === 'NEWS')) {
      await prisma.asset.create({
        data: {
          url,
          originalName: file.name,
          mime: file.type,
          size: buffer.length,
          ownerType: ownerType as any,
          ownerId,
          tag,
        },
      });
    }

    return NextResponse.json({ url }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
