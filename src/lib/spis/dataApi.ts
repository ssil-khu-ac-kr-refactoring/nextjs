import type { SpisDatasetId } from '@/lib/spis/datasets';
import { DEFAULT_SPIS_DATASET } from '@/lib/spis/datasets';
import type { SpisPotentialRow } from '@/lib/spis/types';

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

export interface SpisDatasetStatus {
  id: SpisDatasetId;
  displayName: string;
  description: string | null;
  rowCount: number;
  actualRowCount: number;
  environmentCount: number;
  materialCount: number;
  potentialMin: number | null;
  potentialMax: number | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchSpisPotentials(
  datasetId: SpisDatasetId = DEFAULT_SPIS_DATASET,
): Promise<SpisPotentialRow[]> {
  const res = await fetch(`/api/spis/simulations?dataset=${encodeURIComponent(datasetId)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`데이터 로드 실패 (${res.status})`);
  return res.json();
}

export async function fetchSpisDatasetStatus(): Promise<SpisDatasetStatus[]> {
  const res = await fetch('/api/spis/import', { cache: 'no-store' });
  if (!res.ok) throw new Error(`데이터셋 현황 로드 실패 (${res.status})`);
  return res.json();
}

async function submitImport(file: File, datasetId: SpisDatasetId, mode: 'validate' | 'replace') {
  const form = new FormData();
  form.append('file', file);
  form.append('datasetId', datasetId);
  form.append('mode', mode);
  if (mode === 'replace') form.append('confirmation', `REPLACE_${datasetId}`);
  const res = await fetch('/api/spis/import', { method: 'POST', body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const details = Array.isArray(data.errors) ? ` ${data.errors.slice(0, 5).join(' ')}` : '';
    throw new Error(`${data.error || `업로드 실패 (${res.status})`}${details}`);
  }
  return data as { mode: 'validate' | 'replace'; summary: SpisImportSummary; inserted?: number };
}

export function validateSpisImport(file: File, datasetId: SpisDatasetId) {
  return submitImport(file, datasetId, 'validate');
}

export function replaceSpisDataset(file: File, datasetId: SpisDatasetId) {
  return submitImport(file, datasetId, 'replace');
}
