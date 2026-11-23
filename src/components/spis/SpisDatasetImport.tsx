'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from '@/components/Toast';
import { SPIS_DATASETS, type SpisDatasetId } from '@/lib/spis/datasets';
import {
  replaceSpisDataset,
  fetchSpisDatasetStatus,
  validateSpisImport,
  type SpisDatasetStatus,
  type SpisImportSummary,
} from '@/lib/spis/dataApi';

export default function SpisDatasetImport({ onUpdated }: { onUpdated?: () => Promise<void> | void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [datasetId, setDatasetId] = useState<SpisDatasetId>('DMSP_ONLY');
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<SpisImportSummary | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState<'validate' | 'replace' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<SpisDatasetStatus[]>([]);
  const [statusError, setStatusError] = useState<string | null>(null);

  const loadStatuses = useCallback(async () => {
    try {
      setStatuses(await fetchSpisDatasetStatus());
      setStatusError(null);
    } catch (statusLoadError) {
      setStatusError(statusLoadError instanceof Error ? statusLoadError.message : '데이터셋 현황을 불러오지 못했습니다.');
    }
  }, []);

  useEffect(() => {
    void loadStatuses();
  }, [loadStatuses]);

  const resetValidation = () => {
    setSummary(null);
    setConfirmed(false);
    setError(null);
  };

  const handleValidate = async () => {
    if (!file) return;
    setBusy('validate');
    setError(null);
    try {
      const result = await validateSpisImport(file, datasetId);
      setSummary(result.summary);
      toast.success('파일 검증이 완료되었습니다. 아직 DB에는 저장되지 않았습니다.');
    } catch (validationError) {
      const message = validationError instanceof Error ? validationError.message : '파일 검증에 실패했습니다.';
      setError(message);
      setSummary(null);
      toast.error(message);
    } finally {
      setBusy(null);
    }
  };

  const handleReplace = async () => {
    if (!file || !summary || !confirmed) return;
    setBusy('replace');
    setError(null);
    try {
      const result = await replaceSpisDataset(file, datasetId);
      toast.success(`${datasetId} 데이터셋 ${result.inserted?.toLocaleString()}행 저장 완료`);
      setSummary(result.summary);
      setConfirmed(false);
      await loadStatuses();
      await onUpdated?.();
    } catch (replaceError) {
      const message = replaceError instanceof Error ? replaceError.message : '데이터셋 교체에 실패했습니다.';
      setError(message);
      toast.error(message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div>
        <h2 className="text-xl font-semibold">Dataset Import</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          CSV 또는 XLSX를 먼저 검증한 뒤 선택한 데이터셋만 원자적으로 교체합니다.
        </p>
      </div>

      {statuses.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {statuses.map((status) => (
            <div key={status.id} className="rounded-xl border border-border bg-muted/30 p-3 text-sm">
              <p className="font-semibold">{status.displayName}</p>
              <p className="mt-1 text-muted-foreground">
                {status.actualRowCount.toLocaleString()} rows · {status.environmentCount.toLocaleString()} environments · {status.materialCount.toLocaleString()} materials
              </p>
              {status.rowCount !== status.actualRowCount && (
                <p className="mt-2 text-amber-700">Recorded count and actual count differ. Verify dataset integrity.</p>
              )}
            </div>
          ))}
        </div>
      )}
      {statusError && <p className="text-sm text-amber-700">{statusError}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">
          Target dataset
          <select
            value={datasetId}
            disabled={busy !== null}
            onChange={(event) => {
              setDatasetId(event.target.value as SpisDatasetId);
              resetValidation();
            }}
            className="block min-h-11 w-full rounded-xl border border-border bg-background px-3"
          >
            {SPIS_DATASETS.map((dataset) => (
              <option key={dataset.id} value={dataset.id}>{dataset.label}</option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium">
          CSV / XLSX file
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            disabled={busy !== null}
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              resetValidation();
            }}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:font-medium file:text-primary disabled:opacity-50"
          />
        </label>
      </div>

      <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        선택한 <strong>{datasetId}</strong> 데이터셋만 교체됩니다. 다른 데이터셋은 변경되지 않으며,
        저장 중 오류가 발생하면 트랜잭션이 롤백됩니다.
      </div>

      <button
        type="button"
        onClick={() => void handleValidate()}
        disabled={!file || busy !== null}
        className="min-h-11 rounded-xl border border-border bg-secondary px-4 py-2 font-semibold text-secondary-foreground disabled:opacity-50"
      >
        {busy === 'validate' ? 'Validating...' : 'Validate file'}
      </button>

      {summary && (
        <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
          <h3 className="font-semibold">Validation preview</h3>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div><dt className="text-muted-foreground">Dataset</dt><dd className="font-medium">{summary.datasetId}</dd></div>
            <div><dt className="text-muted-foreground">Source rows</dt><dd className="font-medium">{summary.totalRows.toLocaleString()}</dd></div>
            <div><dt className="text-muted-foreground">Valid rows</dt><dd className="font-medium">{summary.validRows.toLocaleString()}</dd></div>
            <div><dt className="text-muted-foreground">Environments</dt><dd className="font-medium">{summary.environmentCount.toLocaleString()}</dd></div>
            <div><dt className="text-muted-foreground">Materials</dt><dd className="font-medium">{summary.materialCount.toLocaleString()}</dd></div>
            <div><dt className="text-muted-foreground">Materials / environment</dt><dd className="font-medium">{summary.minMaterialsPerEnvironment}–{summary.maxMaterialsPerEnvironment}</dd></div>
            <div><dt className="text-muted-foreground">Potential range</dt><dd className="font-medium">{summary.potentialMin} – {summary.potentialMax} V</dd></div>
          </dl>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={confirmed}
              disabled={busy !== null}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span>검증 결과를 확인했으며 <strong>{datasetId}</strong> 데이터셋만 교체합니다.</span>
          </label>
          <button
            type="button"
            onClick={() => void handleReplace()}
            disabled={!confirmed || busy !== null}
            className="min-h-11 rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50"
          >
            {busy === 'replace' ? 'Replacing dataset...' : `Replace ${datasetId}`}
          </button>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </section>
  );
}
