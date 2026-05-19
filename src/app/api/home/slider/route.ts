import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';
import { requireAdmin } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

const UPLOAD_PATH = process.env.UPLOAD_PATH;

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

export async function GET() {
  try {
    const sliderImages = await prisma.sliderImage.findMany({
      orderBy: { order: 'asc' },
    });
    return NextResponse.json(sliderImages);
  } catch (error) {
    console.error('Error fetching slider images:', error);
    return NextResponse.json({ error: 'Failed to fetch slider images' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  if (!UPLOAD_PATH) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const altText = (formData.get('altText') as string | null) ?? 'Slider Image';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
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
    const baseRaw = path.basename(file.name, ext).replace(/[^\w\-]/g, '_').slice(0, 64) || 'slider';
    const filename = `slider-${Date.now()}-${baseRaw}${ext}`;

    const savePath = path.join(UPLOAD_PATH, filename);
    const resolvedSave = path.resolve(savePath);
    const resolvedRoot = path.resolve(UPLOAD_PATH);
    if (!resolvedSave.startsWith(resolvedRoot + path.sep)) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    await fs.writeFile(resolvedSave, buffer);

    const imageUrl = `/api/files/${filename}`;
    const newImage = await prisma.sliderImage.create({
      data: {
        imageUrl,
        altText,
        order: 0,
      },
    });

    return NextResponse.json(newImage, { status: 201 });
  } catch (error) {
    console.error('Error creating slider image:', error);
    return NextResponse.json({ error: 'Failed to create slider image' }, { status: 500 });
  }
}
