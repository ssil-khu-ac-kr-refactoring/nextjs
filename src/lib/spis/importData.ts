import 'server-only';

import { Prisma } from '@/generated/prisma';
import { parseWorkbookSheet } from '@/lib/spis/parseWorkbook';
import { getSpisDataset, type SpisDatasetId } from '@/lib/spis/datasets';

const MAX_IMPORT_BYTES = 25 * 1024 * 1024;

function norm(value: string): string {
  return String(value ?? '').toLowerCase().replace(/[\s\[\]\(\)\-_·\r\n]/g, '');
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function toStringOrNull(value: unknown): string | null {
  const parsed = String(value ?? '').trim();
  return parsed || null;
}

function parseNode(value: unknown): number {
  const direct = toNumber(value);
  if (direct !== null) return direct;
  const match = /-?\d+/.exec(String(value ?? ''));
  return match ? Number(match[0]) : 0;
}

function normalizeDayNight(value: unknown): 'DAY' | 'NGT' | null {
  const normalized = norm(String(value ?? ''));
  if (normalized.startsWith('day') || normalized === 'd') return 'DAY';
  if (normalized.startsWith('ngt') || normalized.startsWith('night') || normalized === 'n') return 'NGT';
  return null;
}

function parseCsv(text: string): Record<string, string | number | null>[] {
  const matrix: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field);
      if (row.some((cell) => cell.trim())) matrix.push(row);
      row = [];
      field = '';
    } else if (character !== '\r') field += character;
  }
  if (quoted) throw new Error('CSV contains an unclosed quoted field.');
  row.push(field);
  if (row.some((cell) => cell.trim())) matrix.push(row);
  if (matrix.length === 0) return [];
  const headers = matrix[0].map((header) => header.trim());
  return matrix.slice(1).map((values) => {
    const record: Record<string, string | number | null> = {};
    headers.forEach((header, index) => {
      if (!header) return;
      const value = (values[index] ?? '').trim();
      record[header] = value || null;
    });
    return record;
  });
}

export type SpisImportRow = {
  datasetId: SpisDatasetId;
  envId: string | null;
  env: string;
  res: string;
  dn: string;
  node0Mat: string;
  node1Mat: string;
  node: number;
  avPot: number;
  lt: number | null;
  lat: number | null;
  condSolar: string | null;
  kp: string | null;
  eN: number | null;
  eT: number | null;
  iN: number | null;
  iT: number | null;
  dmspEN: number | null;
  dmspET: number | null;
  dmspIN: number | null;
  dmspIT: number | null;
  iriEN: number | null;
  iriET: number | null;
  iriIN: number | null;
  iriIT: number | null;
  form: string | null;
  extras: Prisma.InputJsonValue | typeof Prisma.DbNull;
};

export interface SpisImportSummary {
  datasetId: SpisDatasetId;
  totalRows: number;
  validRows: number;
  environmentCount: number;
  materialCount: number;
  minMaterialsPerEnvironment: number;
  maxMaterialsPerEnvironment: number;
  potentialMin: number;
  potentialMax: number;
}

export async function parseSpisImport(file: File, datasetId: SpisDatasetId) {
  if (file.size > MAX_IMPORT_BYTES) throw new Error('File is too large. Maximum import size is 25 MB.');
  const fileName = String(file.name ?? '');
  if (!/\.(csv|xlsx)$/i.test(fileName)) throw new Error('Only .csv and .xlsx files are supported.');
  const buffer = await file.arrayBuffer();
  let rows: Record<string, string | number | null>[];
  if (/\.csv$/i.test(fileName)) rows = parseCsv(new TextDecoder('utf-8').decode(buffer));
  else ({ rows } = await parseWorkbookSheet(buffer, (name) => name.toLowerCase().includes('all')));
  if (rows.length === 0) throw new Error('No data rows were found.');

  const keys = Object.keys(rows[0]).filter(Boolean);
  const find = (...candidates: string[]) => keys.find((key) => candidates.includes(norm(key)));
  const envKey = find('env');
  const envIdKey = find('envid');
  const projectKey = find('projectname');
  const xmlFileKey = find('xmlfile');
  const resKey = find('res', 'resistance');
  const dnKey = find('dn', 'daynight', 'time', 'timemode');
  const node0Key = find('node0mat', 'node0material', 'node0');
  const node1Key = find('node1mat', 'node1material', 'node1', 'node2mat', 'node2material', 'node2');
  const nodeKey = find('node');
  const potentialKey = find('avpot', 'averagepotential', 'potential');
  const ltKey = find('lt', 'localtime', 'lthr', 'ltimecenter', 'ltime');
  const latKey = find('lat', 'latitude', 'latcenter');
  const condSolarKey = find('condsolar');
  const kpKey = find('kp');
  const eNKey = find('en');
  const eTKey = find('et');
  const iNKey = find('in');
  const iTKey = find('it');
  const dmspENKey = find('dmspen');
  const dmspETKey = find('dmspet');
  const dmspINKey = find('dmspin');
  const dmspITKey = find('dmspit');
  const iriENKey = find('irien');
  const iriETKey = find('iriet');
  const iriINKey = find('iriin');
  const iriITKey = find('iriit');
  const formKey = find('form', 'type');

  const missingColumns: string[] = [];
  if (!node0Key) missingColumns.push('node0Material/Node0_Mat');
  if (!potentialKey) missingColumns.push('Potential/AvPot');
  if (!dnKey && !ltKey) missingColumns.push('DN or ltime_center/LT');
  if (datasetId === 'DMSP_IRI2016') {
    if (!envIdKey) missingColumns.push('env_id');
    if (!ltKey) missingColumns.push('ltime_center/LT');
    if (!latKey) missingColumns.push('lat_center/Lat');
    if (!nodeKey) missingColumns.push('node');
    for (const [key, label] of [
      [eNKey, 'e_n'], [eTKey, 'e_T'], [iNKey, 'i_n'], [iTKey, 'i_T'],
    ] as const) if (!key) missingColumns.push(label);
    for (const [key, label] of [
      [dmspENKey, 'DMSP_e_n'], [dmspETKey, 'DMSP_e_T'], [dmspINKey, 'DMSP_i_n'], [dmspITKey, 'DMSP_i_T'],
      [iriENKey, 'IRI_e_n'], [iriETKey, 'IRI_e_T'], [iriINKey, 'IRI_i_n'], [iriITKey, 'IRI_i_T'],
    ] as const) if (!key) missingColumns.push(label);
  } else if ([iriENKey, iriETKey, iriINKey, iriITKey].some(Boolean)) {
    throw new Error('IRI2016 columns cannot be imported into DMSP_ONLY. Select DMSP_IRI2016 instead.');
  }
  if (missingColumns.length > 0) throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);

  const consumedKeys = new Set([
    envKey, envIdKey, projectKey, xmlFileKey, resKey, dnKey, node0Key, node1Key,
    nodeKey, potentialKey, ltKey, latKey, condSolarKey, kpKey, eNKey, eTKey,
    iNKey, iTKey, dmspENKey, dmspETKey, dmspINKey, dmspITKey, iriENKey,
    iriETKey, iriINKey, iriITKey, formKey,
  ].filter((key): key is string => Boolean(key)));

  const payload: SpisImportRow[] = [];
  const errors: string[] = [];
  const signatures = new Set<string>();
  for (let index = 0; index < rows.length; index += 1) {
    const rowData = rows[index];
    const rowNumber = index + 2;
    const envId = envIdKey ? toStringOrNull(rowData[envIdKey]) : null;
    const node0Mat = String(rowData[node0Key!] ?? '').trim();
    const node1Mat = node1Key ? String(rowData[node1Key] ?? '').trim() : '';
    const avPot = toNumber(rowData[potentialKey!]);
    const lt = ltKey ? toNumber(rowData[ltKey]) : null;
    const lat = latKey ? toNumber(rowData[latKey]) : null;
    let dn = dnKey ? normalizeDayNight(rowData[dnKey]) : null;
    if (!dn && lt !== null) dn = lt >= 6 && lt < 18 ? 'DAY' : 'NGT';
    const rowErrors: string[] = [];
    if (!node0Mat) rowErrors.push('material is missing');
    if (avPot === null) rowErrors.push('Potential is not numeric');
    if (!dn) rowErrors.push('DN/LT cannot determine day or night');
    if (lt !== null && (lt < 0 || lt >= 24)) rowErrors.push('LT must be in [0, 24)');
    if (lat !== null && (lat < -90 || lat > 90)) rowErrors.push('latitude must be in [-90, 90]');
    if (datasetId === 'DMSP_IRI2016' && !envId) rowErrors.push('env_id is missing');
    const plasmaValues = {
      dmspEN: dmspENKey ? toNumber(rowData[dmspENKey]) : null,
      dmspET: dmspETKey ? toNumber(rowData[dmspETKey]) : null,
      dmspIN: dmspINKey ? toNumber(rowData[dmspINKey]) : null,
      dmspIT: dmspITKey ? toNumber(rowData[dmspITKey]) : null,
      iriEN: iriENKey ? toNumber(rowData[iriENKey]) : null,
      iriET: iriETKey ? toNumber(rowData[iriETKey]) : null,
      iriIN: iriINKey ? toNumber(rowData[iriINKey]) : null,
      iriIT: iriITKey ? toNumber(rowData[iriITKey]) : null,
    };
    if (datasetId === 'DMSP_IRI2016') {
      for (const [key, value] of Object.entries({
        eN: eNKey ? toNumber(rowData[eNKey]) : null,
        eT: eTKey ? toNumber(rowData[eTKey]) : null,
        iN: iNKey ? toNumber(rowData[iNKey]) : null,
        iT: iTKey ? toNumber(rowData[iTKey]) : null,
      })) if (value === null) rowErrors.push(`${key} is not numeric`);
      for (const [key, value] of Object.entries(plasmaValues)) if (value === null) rowErrors.push(`${key} is not numeric`);
    }
    if (rowErrors.length > 0) {
      if (errors.length < 50) errors.push(`Row ${rowNumber}: ${rowErrors.join('; ')}`);
      continue;
    }
    const res = resKey ? String(rowData[resKey] ?? '').trim() || 'R0' : 'R0';
    const node = nodeKey ? parseNode(rowData[nodeKey]) : 0;
    const env = envKey ? String(rowData[envKey] ?? '').trim() || envId || 'AUR' : envId || 'AUR';
    const signature = datasetId === 'DMSP_IRI2016'
      ? [envId, node0Mat].join('|')
      : [env, node0Mat, node1Mat, res, node, dn, lt, lat].join('|');
    if (signatures.has(signature)) {
      if (errors.length < 50) errors.push(`Row ${rowNumber}: duplicate environment/material result.`);
      continue;
    }
    signatures.add(signature);
    const extras: Record<string, string | number> = {};
    for (const key of Object.keys(rowData)) {
      if (consumedKeys.has(key)) continue;
      const value = rowData[key];
      if (typeof value === 'number' && Number.isFinite(value)) extras[key] = value;
      else if (value !== null && value !== undefined && String(value).trim()) extras[key] = String(value).trim();
    }
    payload.push({
      datasetId, envId, env, res, dn: dn!, node0Mat, node1Mat, node, avPot: avPot!, lt, lat,
      condSolar: condSolarKey ? toStringOrNull(rowData[condSolarKey]) : null,
      kp: kpKey ? toStringOrNull(rowData[kpKey]) : null,
      eN: eNKey ? toNumber(rowData[eNKey]) : null,
      eT: eTKey ? toNumber(rowData[eTKey]) : null,
      iN: iNKey ? toNumber(rowData[iNKey]) : null,
      iT: iTKey ? toNumber(rowData[iTKey]) : null,
      ...plasmaValues,
      form: formKey ? toStringOrNull(rowData[formKey]) : null,
      extras: Object.keys(extras).length > 0 ? extras : Prisma.DbNull,
    });
  }
  if (payload.length === 0 && errors.length === 0) errors.push('No valid rows were found.');
  const potentials = payload.map((rowData) => rowData.avPot);
  const materialsByEnvironment = new Map<string, Set<string>>();
  for (const rowData of payload) {
    const environment = rowData.envId ?? rowData.env;
    if (!materialsByEnvironment.has(environment)) materialsByEnvironment.set(environment, new Set());
    materialsByEnvironment.get(environment)!.add(rowData.node0Mat);
  }
  const materialsPerEnvironment = [...materialsByEnvironment.values()].map((materials) => materials.size);
  const summary = {
    datasetId,
    totalRows: rows.length,
    validRows: payload.length,
    environmentCount: new Set(payload.map((rowData) => rowData.envId ?? rowData.env)).size,
    materialCount: new Set(payload.map((rowData) => rowData.node0Mat)).size,
    minMaterialsPerEnvironment: materialsPerEnvironment.length ? Math.min(...materialsPerEnvironment) : 0,
    maxMaterialsPerEnvironment: materialsPerEnvironment.length ? Math.max(...materialsPerEnvironment) : 0,
    potentialMin: potentials.length ? Math.min(...potentials) : 0,
    potentialMax: potentials.length ? Math.max(...potentials) : 0,
  };
  const expected = getSpisDataset(datasetId);
  if (expected.expectedRows !== undefined && summary.validRows !== expected.expectedRows) {
    errors.push(`Expected ${expected.expectedRows} valid rows, found ${summary.validRows}.`);
  }
  if (expected.expectedEnvironments !== undefined && summary.environmentCount !== expected.expectedEnvironments) {
    errors.push(`Expected ${expected.expectedEnvironments} environments, found ${summary.environmentCount}.`);
  }
  if (expected.expectedMaterialsPerEnvironment !== undefined && (
    summary.minMaterialsPerEnvironment !== expected.expectedMaterialsPerEnvironment ||
    summary.maxMaterialsPerEnvironment !== expected.expectedMaterialsPerEnvironment
  )) {
    errors.push(
      `Expected ${expected.expectedMaterialsPerEnvironment} materials per environment, found ${summary.minMaterialsPerEnvironment}–${summary.maxMaterialsPerEnvironment}.`,
    );
  }
  return { payload, summary, errors };
}
