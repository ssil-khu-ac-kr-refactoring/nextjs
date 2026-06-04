import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';
import type { SimulationRow, FormType, MaterialType, TimeMode } from '@/lib/spis/types';
import { ENV_FIXED_VALUES } from '@/lib/spis/types';

export const runtime = 'nodejs';

// Excel 컬럼명을 정규화 (대소문자, 공백, 단위 표기 차이 흡수)
function norm(s: string): string {
  return String(s ?? '').toLowerCase().replace(/[\s\[\]\(\)\-_·]/g, '');
}

// 헤더 매핑: Excel 컬럼 → SimulationRow 키
const HEADER_MAP: Record<string, keyof SimulationRow | 'config'> = {
  // 환경
  nth: 'nth', tth: 'tth', ne: 'ne', te: 'te', ni: 'ni', ti: 'ti', alt: 'alt',
  lat: 'lat', lon: 'lon',
  // 재질 물성
  sey: 'sey', mpd: 'mpd', pey: 'pey', ipe: 'ipe', pee: 'pee', msey: 'msey', buc: 'buc', sre: 'sre',
  // 분류
  form: 'form', node0mat: 'node0Mat', node0material: 'node0Mat',
};

// 결과 컬럼 (10개 구성) → { boom, resistance, time }
const RESULT_COLS: Record<string, { boom: 'SINGLE' | 'KAPT' | 'AL2K'; resistance: 'NONE' | 'INF' | '1M'; time: TimeMode }> = {
  singleday: { boom: 'SINGLE', resistance: 'NONE', time: 'DAY' },
  singlengt: { boom: 'SINGLE', resistance: 'NONE', time: 'NGT' },
  kaptboomrinfday: { boom: 'KAPT', resistance: 'INF', time: 'DAY' },
  kaptboomrinfngt: { boom: 'KAPT', resistance: 'INF', time: 'NGT' },
  kaptboomr1mday: { boom: 'KAPT', resistance: '1M', time: 'DAY' },
  kaptboomr1mngt: { boom: 'KAPT', resistance: '1M', time: 'NGT' },
  al2kboomrinfday: { boom: 'AL2K', resistance: 'INF', time: 'DAY' },
  al2kboomrinfngt: { boom: 'AL2K', resistance: 'INF', time: 'NGT' },
  al2kboomr1mday: { boom: 'AL2K', resistance: '1M', time: 'DAY' },
  al2kboomr1mngt: { boom: 'AL2K', resistance: '1M', time: 'NGT' },
  // 줄임/변형 표기 대응
  single_day: { boom: 'SINGLE', resistance: 'NONE', time: 'DAY' },
  single_ngt: { boom: 'SINGLE', resistance: 'NONE', time: 'NGT' },
};

function toNumber(v: any): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
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
    const wb = XLSX.read(buf, { type: 'array' });

    // 'All_node' 시트 우선, 없으면 첫 시트
    const sheetName = wb.SheetNames.find((n) => n.toLowerCase().includes('all')) ?? wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });
    if (rows.length === 0) {
      return NextResponse.json({ error: '시트에 데이터가 없습니다.' }, { status: 400 });
    }

    // 첫 행의 키들로부터 헤더 매핑 인덱스 구축
    const headerKeys = Object.keys(rows[0]);
    const fieldMap: Record<string, keyof SimulationRow> = {};
    const resultMap: Record<string, { boom: 'SINGLE' | 'KAPT' | 'AL2K'; resistance: 'NONE' | 'INF' | '1M'; time: TimeMode }> = {};

    headerKeys.forEach((h) => {
      const k = norm(h);
      if (HEADER_MAP[k] && HEADER_MAP[k] !== 'config') {
        fieldMap[h] = HEADER_MAP[k] as keyof SimulationRow;
      }
      if (RESULT_COLS[k]) resultMap[h] = RESULT_COLS[k];
    });

    if (Object.keys(resultMap).length === 0) {
      return NextResponse.json(
        { error: '결과 컬럼(SINGLE_DAY 등)을 찾을 수 없습니다. 헤더를 확인하세요.' },
        { status: 400 },
      );
    }

    // 행마다 입력값 추출 + 각 결과 컬럼당 SimulationRow 생성
    const payload: any[] = [];
    for (const r of rows) {
      const base: any = { ...ENV_FIXED_VALUES };
      for (const [excelCol, field] of Object.entries(fieldMap)) {
        const v = r[excelCol];
        if (field === 'form') base.form = String(v ?? '').trim() as FormType;
        else if (field === 'node0Mat') base.node0Mat = String(v ?? '').trim() as MaterialType;
        else (base as any)[field] = toNumber(v);
      }
      // form/node0Mat 누락 시 스킵
      if (!base.form || !base.node0Mat) continue;
      if (typeof base.lat !== 'number') base.lat = 90;
      if (typeof base.lon !== 'number') base.lon = 0;

      for (const [excelCol, cfg] of Object.entries(resultMap)) {
        const avPot = toNumber(r[excelCol]);
        if (avPot === null) continue; // 빈 셀 → 저장 안함 (지도에서 dark overlay)

        payload.push({
          form: base.form,
          node0Mat: base.node0Mat,
          timeMode: cfg.time,
          lat: base.lat,
          lon: base.lon,
          avPot,
          nth: base.nth, tth: base.tth, ne: base.ne, te: base.te, ni: base.ni, ti: base.ti, alt: base.alt,
          sey: toNumber(base.sey), mpd: toNumber(base.mpd), pey: toNumber(base.pey),
          ipe: toNumber(base.ipe), pee: toNumber(base.pee), msey: toNumber(base.msey),
          buc: toNumber(base.buc), sre: toNumber(base.sre),
        });
      }
    }

    if (payload.length === 0) {
      return NextResponse.json(
        { error: '업로드할 데이터가 없습니다 (모든 결과 셀이 비어있음).' },
        { status: 400 },
      );
    }

    // 기존 데이터 삭제 후 청크 단위 삽입
    await prisma.simulationRow.deleteMany({});
    for (let i = 0; i < payload.length; i += 500) {
      await prisma.simulationRow.createMany({ data: payload.slice(i, i + 500) });
    }

    return NextResponse.json({ totalRows: rows.length, inserted: payload.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'import failed' }, { status: 500 });
  }
}
