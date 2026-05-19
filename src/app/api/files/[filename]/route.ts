import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const READ_PATH = process.env.READ_PATH;

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff',
  '.pdf': 'application/pdf',
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    if (!READ_PATH) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const filenameRaw = (await params).filename;
    const safeFilename = path.basename(filenameRaw);
    const ext = path.extname(safeFilename).toLowerCase();

    // SVG 등 스크립트 실행 가능한 포맷 차단
    const contentType = MIME_BY_EXT[ext];
    if (!contentType) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const filePath = path.join(READ_PATH, safeFilename);
    const resolvedFile = path.resolve(filePath);
    const resolvedRoot = path.resolve(READ_PATH);
    if (!resolvedFile.startsWith(resolvedRoot + path.sep)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const buffer = await fs.readFile(resolvedFile);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; sandbox",
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
