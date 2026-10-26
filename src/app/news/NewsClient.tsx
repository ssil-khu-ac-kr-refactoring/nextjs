'use client';

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import NewsCard from "./NewsCard";
import NewsForm from "./NewsForm";

interface NewsClientProps {
  initialNews: any[];
}

export default function NewsClient({ initialNews }: NewsClientProps) {
  const { data: session } = useSession();
  const isAdmin = !!session;

  const [news, setNews] = useState(initialNews);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const refreshList = useCallback(async () => {
    const res = await fetch("/api/news", { cache: "no-store" });
    const updated = await res.json();
    setNews(updated);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowCreate(false);
    };
    if (showCreate) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showCreate]);

  return (
    <div>
      {/* Header */}
      <header className="mb-8 text-center sm:mb-12 lg:mb-16">
        <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">NEWS</h1>
        <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Stay up to date with the latest news and announcements from SSIL.
        </p>
      </header>

      {/* Admin: Add (Create) Modal Trigger */}
      {isAdmin && (
        <div className="text-right mb-8">
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition"
          >
            + Add News
          </button>
        </div>
      )}

      {/* News Grid */}
      {news.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl">
          <p className="text-foreground/60">아직 등록된 뉴스가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-10">
          {news.map((item) => (
            <NewsCard key={item.id} item={item} isAdmin={isAdmin} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isAdmin && showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop */}
          <button
            aria-label="Close create modal"
            onClick={() => !submitting && setShowCreate(false)}
            className="absolute inset-0 bg-black/60"
          />
          {/* Dialog */}
          <div className="relative mx-3 max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card text-foreground shadow-xl sm:mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
              <h2 className="text-lg font-semibold">Add News</h2>
              <button
                onClick={() => !submitting && setShowCreate(false)}
                className="rounded-full px-3 py-1 text-sm hover:bg-foreground/5"
              >
                ✕
              </button>
            </div>

            <div className="p-3 sm:p-5">
              <NewsForm
                mode="create"
                onSuccess={async () => {
                  if (submitting) return;
                  setSubmitting(true);
                  await refreshList();
                  setSubmitting(false);
                  setShowCreate(false); // 생성 후 목록에 남아있고 모달만 닫힘
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
