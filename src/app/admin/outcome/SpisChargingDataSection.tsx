'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from '@/components/Toast';
import { fetchSpisPotentials, importExcelFile } from '@/lib/spis/dataApi';
import type { SpisPotentialRow } from '@/lib/spis/types';

interface NumericRange {
  min: number;
  max: number;
  step: number | null;
  count: number;
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  const set = new Set<string>();
  for (const v of values) {
    if (v != null && v !== '') set.add(v);
  }
  return Array.from(set).sort();
}

function numericRange(values: Array<number | null | undefined>): NumericRange | null {
  const nums = Array.from(
    new Set(values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v))),
  ).sort((a, b) => a - b);
  if (nums.length === 0) return null;
  let step: number | null = null;
  for (let i = 1; i < nums.length; i++) {
    const d = nums[i] - nums[i - 1];
    if (d > 0 && (step === null || d < step)) step = d;
  }
  return { min: nums[0], max: nums[nums.length - 1], step, count: nums.length };
}

function formatNum(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

function ChipList({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <div className="text-xs font-semibold text-foreground/60 mb-1">
        {label} <span className="font-normal">({values.length})</span>
      </div>
      {values.length === 0 ? (
        <span className="text-xs text-foreground/40">—</span>
      ) : (
        <div className="flex flex-wrap gap-1">
          {values.map((v) => (
            <span
              key={v}
              className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
            >
              {v}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SpisChargingDataSection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<SpisPotentialRow[] | null>(null);
  const [isLoadingRows, setIsLoadingRows] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadRows = useCallback(async () => {
    setIsLoadingRows(true);
    setLoadError(null);
    try {
      const data = await fetchSpisPotentials();
      setRows(data);
    } catch (err: any) {
      setLoadError(err?.message ?? 'DB 현황을 불러오지 못했습니다.');
    } finally {
      setIsLoadingRows(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const summary = useMemo(() => {
    if (!rows) return null;
    const extraKeys = new Set<string>();
    for (const r of rows) {
      if (r.extras) for (const k of Object.keys(r.extras)) extraKeys.add(k);
    }
    return {
      total: rows.length,
      materials: uniqueStrings(rows.map((r) => r.node0Mat)),
      resistances: uniqueStrings(rows.map((r) => r.res)),
      condSolars: uniqueStrings(rows.map((r) => r.condSolar)),
      kps: uniqueStrings(rows.map((r) => r.kp)),
      forms: uniqueStrings(rows.map((r) => r.form)),
      latRange: numericRange(rows.map((r) => r.lat)),
      ltRange: numericRange(rows.map((r) => r.lt)),
      extraKeys: Array.from(extraKeys).sort(),
    };
  }, [rows]);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadResult(null);
    setUploadError(null);
    try {
      const r = await importExcelFile(selectedFile);
      const msg = `총 ${r.totalRows}행 중 ${r.inserted}행 저장됨`;
      setUploadResult(msg);
      toast.success(`업로드 완료: ${msg}`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadRows();
    } catch (err: any) {
      const msg = err?.message ?? '업로드에 실패했습니다.';
      setUploadError(msg);
      toast.error(`업로드 실패: ${msg}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <h2 className="text-xl font-bold">위성 대전 데이터 (Surface Charging)</h2>

      {/* DB 현황 카드 */}
      <section className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">DB 현황</h3>
          <button
            type="button"
            onClick={loadRows}
            disabled={isLoadingRows}
            className="text-sm bg-secondary text-secondary-foreground border border-border px-3 py-1.5 rounded-xl hover:bg-secondary/80 disabled:opacity-50"
          >
            {isLoadingRows ? '불러오는 중...' : '새로고침'}
          </button>
        </div>

        {loadError && <p className="text-sm text-red-500">DB 현황 로드 실패: {loadError}</p>}

        {isLoadingRows && !rows && <p className="text-sm text-muted-foreground">불러오는 중...</p>}

        {summary && (
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{summary.total.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">행 (SpisPotential)</span>
            </div>

            {summary.total === 0 ? (
              <p className="text-sm p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
                DB 비어있음 — 화면에는 데모 데이터가 표시됩니다
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ChipList label="재질 (Node0_Mat)" values={summary.materials} />
                  <ChipList label="저항 (RES)" values={summary.resistances} />
                  <ChipList label="태양조건 (condSolar)" values={summary.condSolars} />
                  <ChipList label="Kp" values={summary.kps} />
                  <ChipList label="type (form)" values={summary.forms} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs font-semibold text-foreground/60 mb-1">위도 범위 (lat)</div>
                    {summary.latRange ? (
                      <span>
                        {formatNum(summary.latRange.min)}° ~ {formatNum(summary.latRange.max)}°
                        {summary.latRange.step != null && (
                          <span className="text-muted-foreground"> (간격 {formatNum(summary.latRange.step)}°, {summary.latRange.count}개)</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-foreground/40">없음 (전체 위도 대역에 적용)</span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground/60 mb-1">LT 범위 (지방시)</div>
                    {summary.ltRange ? (
                      <span>
                        {formatNum(summary.ltRange.min)}h ~ {formatNum(summary.ltRange.max)}h
                        {summary.ltRange.step != null && (
                          <span className="text-muted-foreground"> (간격 {formatNum(summary.ltRange.step)}h, {summary.ltRange.count}개)</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-foreground/40">없음</span>
                    )}
                  </div>
                </div>

                {summary.extraKeys.length > 0 && (
                  <ChipList label="자동 인식된 추가 인자 (extras)" values={summary.extraKeys} />
                )}
              </>
            )}
          </div>
        )}
      </section>

      {/* 엑셀/CSV 업로드 */}
      <section className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
        <h3 className="text-lg font-semibold">엑셀/CSV 업로드</h3>
        <p className="text-sm p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
          ⚠️ 업로드 시 기존 데이터가 <strong>전체 교체</strong>됩니다.
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx"
            disabled={isUploading}
            onChange={(e) => {
              setSelectedFile(e.target.files?.[0] ?? null);
              setUploadResult(null);
              setUploadError(null);
            }}
            className="block w-full text-sm text-foreground/60 file:mr-4 file:py-2 file:px-4 file:rounded-full
                       file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary
                       hover:file:bg-primary/20 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded-xl disabled:opacity-50"
          >
            {isUploading ? '업로드 중...' : '업로드'}
          </button>
        </div>
        {uploadResult && <p className="text-sm text-green-600">{uploadResult}</p>}
        {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
      </section>
    </div>
  );
}
