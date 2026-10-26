"use client";

import { useMemo, useState } from "react";
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
      <header className="relative flex min-h-[46vh] w-full items-end overflow-hidden sm:min-h-[60vh]">
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

        <div className="absolute left-3 right-3 top-3 z-10 flex items-start justify-between gap-2 sm:left-6 sm:right-6 sm:top-6">
          <Link
            href="/news"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-medium text-white/85 backdrop-blur-sm transition-colors hover:text-white sm:text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to News
          </Link>

          {isAdmin && !editing && (
            <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
              <button
                onClick={() => setEditing(true)}
                className="inline-flex min-h-11 items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-xs text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                <Pencil className="w-3 h-3" />
                Edit
              </button>
              <button
                onClick={onDelete}
                className="inline-flex min-h-11 items-center gap-1 rounded-full bg-red-500/80 px-3 py-2 text-xs text-white backdrop-blur-sm transition hover:bg-red-500"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>
          )}
        </div>

        <FadeIn y={32} duration={0.9} className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-8 sm:px-6 sm:pb-16 md:pb-24">
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-primary sm:mb-4 sm:text-sm sm:tracking-[0.3em]">
            {dateStr}
          </p>
          <h1 className="break-words text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] sm:text-4xl md:text-6xl lg:text-7xl">
            {item.title}
          </h1>
          {item.description && !editing && (
            <p className="mt-4 max-w-3xl break-words text-base leading-relaxed text-white/80 sm:mt-6 sm:text-lg md:text-xl">
              {item.description.replace(/<[^>]*>/g, "").slice(0, 180)}
              {item.description.replace(/<[^>]*>/g, "").length > 180 ? "…" : ""}
            </p>
          )}
        </FadeIn>
      </header>

      <FadeIn y={24} delay={0.1} className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16 md:py-24">
        {!editing ? (
          <div
            className="prose prose-base max-w-none break-words dark:prose-invert sm:prose-lg
              prose-headings:tracking-tight prose-headings:font-bold
              prose-p:leading-relaxed prose-p:text-foreground/85
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-2xl
              sm:first-letter:text-6xl sm:first-letter:font-bold sm:first-letter:text-primary
              sm:first-letter:mr-2 sm:first-letter:float-left sm:first-letter:leading-[0.9]"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(item.contentHtml || item.description || ""),
            }}
          />
        ) : (
          <div className="rounded-2xl border border-border bg-card p-3 sm:p-6">
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

      <FadeIn className="mx-auto max-w-3xl px-4 pb-12 sm:px-6 sm:pb-24">
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 sm:pt-8">
          <Link
            href="/news"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
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
