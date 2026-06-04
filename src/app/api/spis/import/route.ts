import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';
import { parseWorkbookSheet } from '@/lib/spis/parseWorkbook';

export const runtime = 'nodejs';

// 컬럼명 정규화 (대소문자/공백/단위표기 흡수)
function norm(s: string): string {
  return String(s ?? '').toLowerCase().replace(/[\s\[\]\(\)\-_·\r\n]/g, '');
}

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

function normDN(v: unknown): 'DAY' | 'NGT' | null {
  const k = norm(String(v));
  if (k.startsWith('day') || k === 'd') return 'DAY';
  if (k.startsWith('ngt') || k.startsWith('night') || k === 'n') return 'NGT';
  return null;
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const form = await req.formData();
  const file = form.get('file');
  if (!file || typeof (file as File).arrayBuffer !== 'function') {
    return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
  }

  try {
    const buf = await (file as File).arrayBuffer();
    // Hancell(HCell) 호환 파서로 All_node 시트를 읽는다.
    const { rows } = await parseWorkbookSheet(buf, (n) => n.toLowerCase().includes('all'));
    if (rows.length === 0) {
      return NextResponse.json({ error: 'All_node 시트에 데이터가 없습니다.' }, { status: 400 });
    }

    // 헤더 → 실제 키 매핑 (정규화 기반)
    const keys = Object.keys(rows[0]);
    const find = (...cands: string[]) =>
      keys.find((k) => cands.includes(norm(k)));
    const envKey = find('env');
    const resKey = find('res', 'resistance');
    const dnKey = find('dn', 'daynight', 'time', 'timemode');
    const n0Key = find('node0mat', 'node0material', 'node0');
    const n1Key = find('node1mat', 'node1material', 'node1');
    const nodeKey = find('node');
    const avKey = find('avpot', 'averagepotential', 'potential');

    if (!dnKey || !n0Key || !avKey) {
      return NextResponse.json(
        {
          error:
            '필수 컬럼을 찾을 수 없습니다. (DN, Node0_Mat, AvPot 필요) — 헤더: ' +
            keys.join(', '),
        },
        { status: 400 },
      );
    }

    const payload: {
      env: string; res: string; dn: string;
      node0Mat: string; node1Mat: string; node: number; avPot: number;
    }[] = [];

    for (const r of rows) {
      const dn = normDN(r[dnKey]);
      const avPot = toNumber(r[avKey]);
      const node0Mat = String(r[n0Key] ?? '').trim();
      if (!dn || avPot === null || !node0Mat) continue; // 불완전 행 스킵
      payload.push({
        env: envKey ? String(r[envKey] ?? '').trim() || 'AUR' : 'AUR',
        res: resKey ? String(r[resKey] ?? '').trim() || 'R0' : 'R0',
        dn,
        node0Mat,
        node1Mat: n1Key ? String(r[n1Key] ?? '').trim() : '',
        node: nodeKey ? (toNumber(r[nodeKey]) ?? 0) : 0,
        avPot,
      });
    }

    if (payload.length === 0) {
      return NextResponse.json(
        { error: '업로드할 유효한 데이터 행이 없습니다.' },
        { status: 400 },
      );
    }

    await prisma.spisPotential.deleteMany({});
    for (let i = 0; i < payload.length; i += 500) {
      await prisma.spisPotential.createMany({ data: payload.slice(i, i + 500) });
    }

    return NextResponse.json({ totalRows: rows.length, inserted: payload.length });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'import failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
