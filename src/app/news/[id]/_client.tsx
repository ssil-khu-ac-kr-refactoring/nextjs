"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import NewsForm from "../NewsForm";
import { sanitizeHtml } from "@/lib/sanitize";
import { BLUR_DATA_URL } from "@/lib/blurDataURL";
import { FadeIn } from "@/components/anim/FadeIn";

type NewsItem = {
  id: string;
  title: string;
  description: string | null;
  contentHtml?: string | null;
  imageUrl?: string | null;
  publishedAt: string;
  publishedDateStr?: string;
};

const fmt =
  typeof Intl !== "undefined"
    ? new Intl.DateTimeFormat("en-GB", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        timeZone: "UTC",
      })
    : null;

export default function NewsDetailClient({
  initialItem,
  startInEdit = false,
}: {
  initialItem: NewsItem;
  startInEdit?: boolean;
}) {
  const { data: session } = useSession();
  const isAdmin = !!session;
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [item, setItem] = useState<NewsItem | null>(initialItem ?? null);
  const [editing, setEditing] = useState<boolean>(startInEdit);

  const fetchOne = useMemo(
    () => async () => {
      const res = await fetch(`/api/news/${params.id}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setItem({
          ...data,
          publishedAt: new Date(data.publishedAt).toISOString(),
          publishedDateStr: fmt
            ? fmt.format(new Date(data.publishedAt))
            : new Date(data.publishedAt).toISOString().slice(0, 10),
        });
      }
    },
    [params.id]
  );

  const onDelete = async () => {
    if (!confirm("Delete this news?")) return;
    const res = await fetch(`/api/news/${params.id}`, { method: "DELETE" });
    if (res.ok) router.push("/news");
  };

  if (!item) {
    return (
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 py-10">
        <div className="animate-pulse h-8 w-2/3 bg-foreground/10 rounded" />
        <div className="animate-pulse h-5 w-1/3 bg-foreground/10 rounded" />
        <div className="animate-pulse h-80 w-full bg-foreground/10 rounded-2xl" />
      </article>
    );
  }

  const dateStr =
    item.publishedDateStr ??
    (fmt
      ? fmt.format(new Date(item.publishedAt))
      : new Date(item.publishedAt).toISOString().slice(0, 10));

  return (
    <article>
      {/* Hero — 풀폭 이미지 + 그라데이션 오버레이 + 큰 타이포 */}
      <header className="relative w-full min-h-[60vh] flex items-end overflow-hidden">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            sizes="100vw"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            priority
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />

        {/* Back link & admin actions */}
        <div className="absolute top-6 left-6 right-6 z-10 flex items-center justify-between">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-sm font-medium text-white/85 hover:text-white transition-colors backdrop-blur-sm bg-white/10 px-3 py-1.5 rounded-full"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to News
          </Link>

          {isAdmin && !editing && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition"
              >
                <Pencil className="w-3 h-3" />
                Edit
              </button>
              <button
                onClick={onDelete}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-full bg-red-500/80 backdrop-blur-sm text-white hover:bg-red-500 transition"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>
          )}
        </div>

        <FadeIn y={32} duration={0.9} className="relative z-10 w-full max-w-5xl mx-auto px-6 pb-16 md:pb-24">
          <p className="text-sm uppercase tracking-[0.3em] text-primary mb-4">
            {dateStr}
          </p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
            {item.title}
          </h1>
          {item.description && !editing && (
            <p className="mt-6 text-lg md:text-xl text-white/80 max-w-3xl leading-relaxed">
              {item.description.replace(/<[^>]*>/g, "").slice(0, 180)}
              {item.description.replace(/<[^>]*>/g, "").length > 180 ? "…" : ""}
            </p>
          )}
        </FadeIn>
      </header>

      {/* Body — 좁은 컬럼 + 큰 본문 + drop cap */}
      <FadeIn y={24} delay={0.1} className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        {!editing ? (
          <div
            className="prose prose-lg dark:prose-invert max-w-none
              prose-headings:tracking-tight prose-headings:font-bold
              prose-p:leading-relaxed prose-p:text-foreground/85
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-2xl
              first-letter:text-6xl first-letter:font-bold first-letter:text-primary
              first-letter:mr-2 first-letter:float-left first-letter:leading-[0.9]"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(item.contentHtml || item.description || ""),
            }}
          />
        ) : (
          <div className="bg-card border border-border rounded-2xl p-6">
            <NewsForm
              mode="edit"
              newsId={item.id}
              defaultValues={{
                title: item.title,
                description: item.description,
                imageUrl: item.imageUrl,
                publishedAt: item.publishedAt,
              }}
              onSuccess={async () => {
                await fetchOne();
                setEditing(false);
                router.refresh();
              }}
            />
          </div>
        )}
      </FadeIn>

      {/* Footer — 더 많은 뉴스 보기 */}
      <FadeIn className="max-w-3xl mx-auto px-6 pb-24">
        <div className="border-t border-border pt-8 flex items-center justify-between">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            All News
          </Link>
          <span className="text-xs text-foreground/50">{dateStr}</span>
        </div>
      </FadeIn>
    </article>
  );
}
