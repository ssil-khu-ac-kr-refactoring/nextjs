import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';
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

// 문자열 셀 → 비어있으면 null (환경 파라미터용)
function toStr(v: unknown): string | null {
  const s = String(v ?? '').trim();
  return s === '' ? null : s;
}

// 단순 CSV 파서 — 데이터에 따옴표로 감싼 콤마가 없으므로 split 으로 충분하다.
// 첫 비어있지 않은 줄을 헤더로 삼아 parseWorkbookSheet 와 동일한 rows 형태를 만든다.
function parseCsv(text: string): Record<string, string | number | null>[] {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // BOM 제거
  const lines = text.split(/\r?\n/);
  const headerIdx = lines.findIndex((l) => l.trim() !== '');
  if (headerIdx < 0) return [];
  const header = lines[headerIdx].split(',').map((h) => h.trim());
  const rows: Record<string, string | number | null>[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') continue;
    const cells = line.split(',');
    const obj: Record<string, string | number | null> = {};
    header.forEach((h, c) => {
      if (h) obj[h] = (cells[c] ?? '').trim() || null;
    });
    rows.push(obj);
  }
  return rows;
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
    const fileName = String((file as File).name ?? '');
    // .csv 확장자이거나 zip(PK) 매직이 아니면 CSV 로 파싱, 아니면 xlsx(All_node 시트).
    const bytes = new Uint8Array(buf.slice(0, 2));
    const isZip = bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b;
    let rows: Record<string, string | number | null>[];
    if (/\.csv$/i.test(fileName) || !isZip) {
      rows = parseCsv(new TextDecoder('utf-8').decode(buf));
    } else {
      // Hancell(HCell) 호환 파서로 All_node 시트를 읽는다.
      ({ rows } = await parseWorkbookSheet(buf, (n) => n.toLowerCase().includes('all')));
    }
    if (rows.length === 0) {
      return NextResponse.json({ error: '데이터 행이 없습니다. (All_node 시트 또는 CSV)' }, { status: 400 });
    }

    // 헤더 → 실제 키 매핑 (정규화 기반)
    const keys = Object.keys(rows[0]);
    const find = (...cands: string[]) =>
      keys.find((k) => cands.includes(norm(k)));
    const envKey = find('env');
    const resKey = find('res', 'resistance');
    const dnKey = find('dn', 'daynight', 'time', 'timemode');
    const n0Key = find('node0mat', 'node0material', 'node0');
    // 실데이터는 boom 재질을 node2Material 로 표기한다 (node1Mat 로 저장).
    const n1Key = find('node1mat', 'node1material', 'node1', 'node2mat', 'node2material', 'node2');
    const nodeKey = find('node');
    const avKey = find('avpot', 'averagepotential', 'potential');
    // 위치는 경도가 아니라 LT(지방시)로 들어온다. LT/위도 컬럼이 있으면 함께 저장한다.
    const ltKey = find('lt', 'localtime', 'lthr', 'lt_h', 'ltimecenter', 'ltime');
    const latKey = find('lat', 'latitude', 'latcenter');
    // 환경 파라미터 (실데이터 헤더: cond_Solar, Kp, e_n, e_T, i_n, i_T, type).
    // norm() 은 공백/괄호/-/_ 제거 + 소문자화 — find() 는 정규화된 헤더와 정확히 일치할 때만 매칭.
    const condKey = find('condsolar');
    const kpKey = find('kp');
    const eNKey = find('en');
    const eTKey = find('et');
    const iNKey = find('in');
    const iTKey = find('it');
    const formKey = find('form', 'type');

    // 인식(소비)된 헤더 집합 — 여기 없는 헤더는 전부 extras(JSON)로 자동 수용된다.
    const consumedKeys = new Set(
      [
        envKey, resKey, dnKey, n0Key, n1Key, nodeKey, avKey, ltKey, latKey,
        condKey, kpKey, eNKey, eTKey, iNKey, iTKey, formKey,
      ].filter((k): k is string => Boolean(k)),
    );

    // DN 컬럼이 없어도 LT가 있으면 LT로 주야를 도출할 수 있으므로 허용한다.
    if (!n0Key || !avKey || (!dnKey && !ltKey)) {
      return NextResponse.json(
        {
          error:
            '필수 컬럼을 찾을 수 없습니다. (Node0_Mat, AvPot 와 DN 또는 LT 필요) — 헤더: ' +
            keys.join(', '),
        },
        { status: 400 },
      );
    }

    const payload: {
      env: string; res: string; dn: string;
      node0Mat: string; node1Mat: string; node: number; avPot: number;
      lt: number | null; lat: number | null;
      condSolar: string | null; kp: string | null;
      eN: number | null; eT: number | null; iN: number | null; iT: number | null;
      form: string | null;
      extras: Record<string, string | number> | typeof Prisma.DbNull;
    }[] = [];

    for (const r of rows) {
      const avPot = toNumber(r[avKey]);
      const node0Mat = String(r[n0Key] ?? '').trim();
      const lt = ltKey ? toNumber(r[ltKey]) : null;
      let dn = dnKey ? normDN(r[dnKey]) : null;
      // DN이 비어 있으면 LT로 도출 (낮 06~18시, 그 외 밤).
      if (!dn && lt !== null) dn = lt >= 6 && lt < 18 ? 'DAY' : 'NGT';
      // Potential 이 비어있거나 숫자가 아닌 행은 스킵.
      if (!dn || avPot === null || !node0Mat) continue; // 불완전 행 스킵
      // 인식되지 않은 나머지 컬럼 전부 → extras (원본 헤더명 그대로, 숫자는 숫자로 유지).
      const extras: Record<string, string | number> = {};
      for (const k of Object.keys(r)) {
        if (consumedKeys.has(k)) continue;
        const v = r[k];
        if (v === null || v === undefined) continue;
        if (typeof v === 'number') {
          if (Number.isFinite(v)) extras[k] = v;
          continue;
        }
        const s = String(v).trim();
        if (s !== '') extras[k] = s;
      }
      payload.push({
        env: envKey ? String(r[envKey] ?? '').trim() || 'AUR' : 'AUR',
        res: resKey ? String(r[resKey] ?? '').trim() || 'R0' : 'R0',
        dn,
        node0Mat,
        node1Mat: n1Key ? String(r[n1Key] ?? '').trim() : '',
        node: nodeKey ? (toNumber(r[nodeKey]) ?? 0) : 0,
        avPot,
        lt,
        lat: latKey ? toNumber(r[latKey]) : null,
        condSolar: condKey ? toStr(r[condKey]) : null,
        kp: kpKey ? toStr(r[kpKey]) : null,
        eN: eNKey ? toNumber(r[eNKey]) : null,
        eT: eTKey ? toNumber(r[eTKey]) : null,
        iN: iNKey ? toNumber(r[iNKey]) : null,
        iT: iTKey ? toNumber(r[iTKey]) : null,
        form: formKey ? toStr(r[formKey]) : null,
        extras: Object.keys(extras).length > 0 ? extras : Prisma.DbNull,
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
