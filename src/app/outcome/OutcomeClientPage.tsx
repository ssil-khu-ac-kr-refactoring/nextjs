"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Outcome } from "@/generated/prisma";
import PageLayout from "@/components/PageLayout";
import { sanitizeHtml } from "@/lib/sanitize";
import { BLUR_DATA_URL } from "@/lib/blurDataURL";

// three.js / @react-three/fiber must run client-side only.
const SpisApp = dynamic(() => import("@/components/spis/SpisApp"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
      Loading visualization…
    </div>
  ),
});

// slug → 전용 컴포넌트로 렌더할 항목. (HTML 콘텐츠 대신 인터랙티브 화면을 보여준다)
const SURFACE_CHARGING_SLUG = "satellite-surface-charging";

interface OutcomeClientPageProps {
  outcomes: Outcome[];
}

export default function OutcomeClientPage({ outcomes }: OutcomeClientPageProps) {
  const router = useRouter();
  const params = useSearchParams();

  const idxParam = parseInt(params.get("idx") || "0", 10);
  const [selectedIdx, setSelectedIdx] = useState<number>(isNaN(idxParam) ? 0 : idxParam);

  useEffect(() => {
    setSelectedIdx(isNaN(idxParam) ? 0 : idxParam);
  }, [idxParam]);

  const handleClick = (idx: number) => {
    setSelectedIdx(idx);
    router.push(`/outcome?idx=${idx}`, { scroll: false });
  };

  const item = outcomes[selectedIdx] || outcomes[0] || null;
  const isSurfaceCharging = item?.slug === SURFACE_CHARGING_SLUG;

  return (
    <PageLayout>
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground">Outcomes</h1>
        </header>

        <div className="flex flex-col lg:flex-row gap-5">
          {/* 좌측 항목 리스트 (네모박스) */}
          <nav className="w-full lg:w-48 lg:shrink-0 space-y-1.5">
            {outcomes.map((o, idx) => (
              <button
                key={o.id}
                onClick={() => handleClick(idx)}
                className={`block w-full text-left py-2 px-3 rounded-lg border text-sm transition ${
                  idx === selectedIdx
                    ? "bg-primary/15 border-primary/40 text-primary font-semibold"
                    : "bg-card/40 border-border text-foreground/80 hover:bg-primary/10 hover:border-primary/30"
                }`}
              >
                {o.title}
              </button>
            ))}
            {outcomes.length === 0 && (
              <p className="text-sm text-muted-foreground px-4">등록된 항목이 없습니다.</p>
            )}
          </nav>

          {/* 우측 내용 */}
          <div className="flex-1 min-w-0 space-y-6">
            {item ? (
              <div className="text-foreground">
                <div className="text-sm text-muted-foreground mb-4">
                  <span>Outcomes</span>
                  <span className="mx-2">/</span>
                  <span className="text-primary font-medium">{item.title}</span>
                </div>

                {isSurfaceCharging ? (
                  // 현재 SPIS 화면(위성 표면 대전 시각화)을 그대로 렌더
                  <div className="rounded-2xl overflow-hidden border border-border">
                    <SpisApp />
                  </div>
                ) : (
                  <>
                    {item.imageUrl && (
                      <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-4">
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          sizes="(min-width: 1024px) 66vw, 100vw"
                          placeholder="blur"
                          blurDataURL={BLUR_DATA_URL}
                          className="object-cover"
                        />
                      </div>
                    )}
                    <h2 className="text-2xl lg:text-3xl font-bold mb-2">{item.title}</h2>
                    {item.description && (
                      <p className="text-muted-foreground mb-4">{item.description}</p>
                    )}
                    {item.contentHtml && (
                      <div className="p-6 rounded-2xl prose dark:prose-invert max-w-none mt-4 bg-card/50 border border-border">
                        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.contentHtml) }} />
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-20 border border-dashed border-border rounded-2xl">
                <p className="text-foreground/60">항목을 선택하세요.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
