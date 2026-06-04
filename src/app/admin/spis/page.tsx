"use client";

import { useRef, useState } from "react";
import { toast } from "@/components/Toast";
import { importExcelFile, adminLoadSampleData } from "@/lib/spis/dataApi";

export default function ManageSpisPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setBusy(true);
    setLastResult(null);
    try {
      const r = await importExcelFile(file);
      const msg = `엑셀 업로드 완료: ${r.inserted}개 저장 (전체 ${r.totalRows}행)`;
      toast.success(msg);
      setLastResult(msg);
    } catch (e: any) {
      toast.error(`업로드 실패: ${e.message ?? e}`);
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSample = async () => {
    setBusy(true);
    setLastResult(null);
    try {
      const r = await adminLoadSampleData();
      const msg = `샘플 데이터 생성: 시뮬레이션 ${r.rows}개 + 매트릭스 ${r.matrix}개 저장`;
      toast.success(msg);
      setLastResult(msg);
    } catch (e: any) {
      toast.error(`샘플 로드 실패: ${e.message ?? e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Manage SPIS Data</h1>
        <p className="text-sm text-muted-foreground mt-2">
          위성 전위 시각화(<a href="/spis" className="underline hover:text-primary" target="_blank" rel="noreferrer">/spis</a>)에 표시될 데이터를 관리합니다.
          엑셀 업로드 또는 샘플 생성 시 <strong>기존 데이터는 모두 교체</strong>됩니다.
        </p>
      </div>

      {/* 엑셀 업로드 */}
      <section className="bg-white dark:bg-neutral-900 p-6 rounded border border-border shadow-sm space-y-4">
        <h2 className="text-xl font-semibold">엑셀 업로드 (.xlsx)</h2>
        <p className="text-sm text-muted-foreground">
          <code>All_node</code> 시트의 <code>ENV, RES, DN, Node0_Mat, Node1_Mat, Node, AvPot</code>
          컬럼을 읽어 저장합니다. 한컴 한셀(HCell)로 저장한 파일도 지원합니다.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
          }}
          className="block w-full text-sm file:mr-4 file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50"
        />
      </section>

      {/* 샘플 데이터 */}
      <section className="bg-white dark:bg-neutral-900 p-6 rounded border border-border shadow-sm space-y-4">
        <h2 className="text-xl font-semibold">샘플(랜덤) 데이터 생성</h2>
        <p className="text-sm text-muted-foreground">
          엑셀 없이 테스트용 무작위 데이터를 생성해 저장합니다.
        </p>
        <button
          type="button"
          onClick={handleSample}
          disabled={busy}
          className="bg-secondary text-secondary-foreground border border-border px-4 py-2 rounded disabled:opacity-50"
        >
          {busy ? "처리 중..." : "샘플 데이터 생성"}
        </button>
      </section>

      {busy && <p className="text-sm text-muted-foreground">처리 중입니다…</p>}
      {lastResult && <p className="text-sm text-green-600">{lastResult}</p>}
    </div>
  );
}
