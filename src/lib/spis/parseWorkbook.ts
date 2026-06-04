import 'server-only';
import JSZip from 'jszip';

// Minimal, dependency-light .xlsx reader that tolerates Hancom Hancell (HCell)
// exports. Hancell writes OOXML with the spreadsheetml namespace PREFIXED
// (<x:worksheet>, <x:row>, <x:c>, <x:sst>) and spaces around attribute '='
// (PartName = "..."), which SheetJS/xlsx@0.18.5 and ExcelJS fail to parse.
// We strip the `x:` prefix and read cells directly. Standard (unprefixed)
// OOXML files also parse fine since the strip is then a no-op.

function stripPrefix(xml: string): string {
  return xml.replace(/<x:/g, '<').replace(/<\/x:/g, '</');
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&');
}

function colToIndex(ref: string): number {
  const m = /^([A-Z]+)/.exec(ref);
  if (!m) return 0;
  let n = 0;
  for (const ch of m[1]) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function rowOf(ref: string): number {
  const m = /(\d+)$/.exec(ref);
  return m ? parseInt(m[1], 10) : 0;
}

export interface ParsedSheet {
  name: string;
  /** Array-of-arrays of cell values (blank rows preserved as the grid dictates). */
  aoa: (string | number | null)[][];
  /** Array of objects keyed by the first row's header text. */
  rows: Record<string, string | number | null>[];
}

/**
 * Parse the first sheet whose name satisfies `matchName` (default: contains "all").
 * Returns both the raw grid and header-keyed objects.
 */
export async function parseWorkbookSheet(
  buf: ArrayBuffer | Buffer | Uint8Array,
  matchName: (name: string) => boolean = (n) => n.toLowerCase().includes('all'),
): Promise<ParsedSheet> {
  const zip = await JSZip.loadAsync(buf as ArrayBuffer);

  // Shared strings
  const strings: string[] = [];
  const ssFile = zip.file('xl/sharedStrings.xml');
  if (ssFile) {
    const ss = stripPrefix(await ssFile.async('string'));
    for (const si of ss.match(/<si>[\s\S]*?<\/si>/g) || []) {
      const parts = [...si.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => decodeEntities(m[1]));
      strings.push(parts.join(''));
    }
  }

  // Workbook: sheet name -> relationship id
  const wbFile = zip.file('xl/workbook.xml');
  if (!wbFile) throw new Error('워크북(xl/workbook.xml)을 찾을 수 없습니다.');
  const wbxml = stripPrefix(await wbFile.async('string'));
  const sheets = [...wbxml.matchAll(/<sheet\b[^>]*\bname="([^"]*)"[^>]*\br:id="([^"]*)"[^>]*\/?>/g)].map(
    (m) => ({ name: m[1], rid: m[2] }),
  );
  if (sheets.length === 0) throw new Error('시트를 찾을 수 없습니다.');

  // Workbook rels: rId -> target path
  const relsFile = zip.file('xl/_rels/workbook.xml.rels');
  const ridToTarget: Record<string, string> = {};
  if (relsFile) {
    const rels = await relsFile.async('string');
    for (const m of rels.matchAll(/<Relationship\b[^>]*\bId="([^"]*)"[^>]*\bTarget="([^"]*)"[^>]*\/?>/g)) {
      ridToTarget[m[1]] = m[2];
    }
  }

  const target = sheets.find((s) => matchName(s.name)) || sheets[0];
  let path = ridToTarget[target.rid] || `worksheets/sheet1.xml`;
  path = path.replace(/^\//, '');
  if (!path.startsWith('xl/')) path = 'xl/' + path;
  const wsFile = zip.file(path);
  if (!wsFile) throw new Error(`워크시트 파일을 찾을 수 없습니다: ${path}`);
  const wsxml = stripPrefix(await wsFile.async('string'));

  // Cells -> grid
  const gridByRow: Record<number, Record<number, string | number | null>> = {};
  let maxCol = -1;
  let maxRow = 0;
  for (const rowM of wsxml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const cellsXml = rowM[1];
    for (const cM of cellsXml.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cM[1];
      const inner = cM[2] || '';
      const ref = (/\br="([^"]*)"/.exec(attrs) || [])[1];
      if (!ref) continue;
      const t = (/\bt="([^"]*)"/.exec(attrs) || [])[1];
      const r = rowOf(ref);
      const ci = colToIndex(ref);
      const vM = /<v>([\s\S]*?)<\/v>/.exec(inner);
      const isM = /<t[^>]*>([\s\S]*?)<\/t>/.exec(inner); // inline string
      let val: string | number | null = null;
      if (t === 's' && vM) val = strings[parseInt(vM[1], 10)] ?? null;
      else if ((t === 'inlineStr' || t === 'str') && isM) val = decodeEntities(isM[1]);
      else if (t === 'str' && vM) val = decodeEntities(vM[1]);
      else if (vM) {
        const num = Number(vM[1]);
        val = Number.isFinite(num) ? num : decodeEntities(vM[1]);
      }
      (gridByRow[r] ||= {})[ci] = val;
      if (ci > maxCol) maxCol = ci;
      if (r > maxRow) maxRow = r;
    }
  }

  const aoa: (string | number | null)[][] = [];
  for (let r = 1; r <= maxRow; r++) {
    const cells = gridByRow[r];
    const arr: (string | number | null)[] = [];
    for (let c = 0; c <= maxCol; c++) arr[c] = cells && c in cells ? cells[c] : null;
    aoa.push(arr);
  }

  // Header-keyed objects (first non-empty row is the header)
  const headerIdx = aoa.findIndex((row) => row.some((v) => v !== null && String(v).trim() !== ''));
  const header = headerIdx >= 0 ? aoa[headerIdx].map((h) => String(h ?? '').trim()) : [];
  const rows: Record<string, string | number | null>[] = [];
  for (let i = headerIdx + 1; i < aoa.length; i++) {
    const row = aoa[i];
    if (!row || row.every((v) => v === null || String(v).trim() === '')) continue;
    const obj: Record<string, string | number | null> = {};
    header.forEach((h, c) => {
      if (h) obj[h] = row[c] ?? null;
    });
    rows.push(obj);
  }

  return { name: target.name, aoa, rows };
}
