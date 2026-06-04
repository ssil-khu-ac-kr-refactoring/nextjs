import type { SpisPotentialRow } from '@/lib/spis/types';

// Public read of all SPIS average-potential rows.
export async function fetchSpisPotentials(): Promise<SpisPotentialRow[]> {
  const res = await fetch('/api/spis/simulations', { cache: 'no-store' });
  if (!res.ok) throw new Error(`데이터 로드 실패 (${res.status})`);
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
