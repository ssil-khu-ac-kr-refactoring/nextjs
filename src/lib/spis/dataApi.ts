import type { SimulationRow, PotentialResult } from '@/lib/spis/types';

export async function fetchAllSimulationRows(): Promise<SimulationRow[]> {
  const res = await fetch('/api/spis/simulations', { cache: 'no-store' });
  if (!res.ok) throw new Error(`시뮬레이션 데이터 로드 실패 (${res.status})`);
  return res.json();
}

export async function fetchAllPotentialMatrix(): Promise<PotentialResult[]> {
  const res = await fetch('/api/spis/matrix', { cache: 'no-store' });
  if (!res.ok) throw new Error(`매트릭스 로드 실패 (${res.status})`);
  return res.json();
}

// Admin-only (server enforces auth). Uploads an .xlsx file.
export async function importExcelFile(file: File): Promise<{ totalRows: number; inserted: number }> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/spis/import', { method: 'POST', body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `업로드 실패 (${res.status})`);
  return data;
}

// Admin-only. Regenerates random sample data on the server.
export async function adminLoadSampleData(): Promise<{ rows: number; matrix: number }> {
  const res = await fetch('/api/spis/sample', { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `샘플 로드 실패 (${res.status})`);
  return data;
}
