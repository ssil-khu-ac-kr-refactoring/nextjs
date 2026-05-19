"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft } from "lucide-react";
import NewsForm from "../NewsForm";
import { sanitizeHtml } from "@/lib/sanitize";

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
      month: "2-digit",
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
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<boolean>(startInEdit);

  const fetchOne = useMemo(
    () => async () => {
      setLoading(true);
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
      setLoading(false);
    },
    [params.id]
  );

  useEffect(() => {
  }, []);

  const onDelete = async () => {
    if (!confirm("Delete this news?")) return;
    await fetch(`/api/news/${params.id}`, { method: "DELETE" });
    router.push("/news");
  };

  if (!item) {
    return (
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex justify-start mb-2 mt-6">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to News
          </Link>
        </div>
        <div className="animate-pulse h-8 w-2/3 bg-foreground/10 rounded mb-4" />
        <div className="animate-pulse h-5 w-1/3 bg-foreground/10 rounded mb-8" />
        <div className="relative w-full h-80 rounded-xl overflow-hidden mb-8">
          <div className="absolute inset-0 bg-foreground/10" />
        </div>
      </article>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      <div className="flex justify-start mb-2 mt-6">
        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to News
        </Link>
      </div>

      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-foreground">{item.title}</h1>
        <p className="text-sm text-muted-foreground">
          Published on{" "}
          {item.publishedDateStr ??
            (fmt
              ? fmt.format(new Date(item.publishedAt))
              : new Date(item.publishedAt).toISOString().slice(0, 10))}
        </p>

        {isAdmin && (
          <div className="pt-2 text-right">
            {!editing ? (
              <div className="text-sm text-muted-foreground">
                <button
                  onClick={() => setEditing(true)}
                  className="hover:text-foreground underline-offset-4 hover:underline"
                >
                  Edit
                </button>
                <span className="mx-2 select-none">|</span>
                <button
                  onClick={onDelete}
                  className="hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <button
                  onClick={() => setEditing(false)}
                  className="hover:text-foreground underline-offset-4 hover:underline"
                >
                  Cancel
                </button>
                <span className="mx-2 select-none">|</span>
                <button
                  onClick={onDelete}
                  className="hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}

      </header>

      {item.imageUrl && (
        <div className="relative w-full h-[400px] overflow-hidden rounded-lg shadow-sm">
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {!editing ? (
        <div
          className="prose prose-neutral dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(item.contentHtml || item.description || ""),
          }}
        />
      ) : (
        <div className="bg-background border border-border/30 rounded-xl p-4">
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
    </article>
  );
}