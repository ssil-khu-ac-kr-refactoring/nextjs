"use client";

import dynamic from "next/dynamic";
import SpisDatasetImport from "@/components/spis/SpisDatasetImport";

const SpisApp = dynamic<{ showExperimentalViews?: boolean }>(
  () => import("@/components/spis/SpisApp"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
        Loading SPIS preview…
      </div>
    ),
  },
);

export default function ManageSpisPage() {
  return (
    <div className="container mx-auto space-y-8 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold">Manage SPIS Data</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          위성 전위 시각화(<a href="/spis" className="underline hover:text-primary" target="_blank" rel="noreferrer">/spis</a>)의
          DMSP-only 및 DMSP + IRI2016 데이터셋을 독립적으로 관리합니다.
        </p>
      </div>

      <SpisDatasetImport />

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Admin Visualization Preview</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            관리자 전용 3D Globe와 클라이언트 로컬 데모를 포함한 전체 시각화를 확인합니다.
            데모 데이터는 DB에 저장되지 않습니다.
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-border">
          <SpisApp showExperimentalViews />
        </div>
      </section>
    </div>
  );
}
