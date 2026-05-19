'use client';

import Image from "next/image";
import Link from "next/link";
import { sanitizeHtml } from "@/lib/sanitize";
import { BLUR_DATA_URL } from "@/lib/blurDataURL";

const newsDateFormatter =
  typeof Intl !== "undefined"
    ? new Intl.DateTimeFormat("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: "UTC",
      })
    : null;

interface NewsCardProps {
  item: any;
  isAdmin: boolean;
}

export default function NewsCard({ item, isAdmin }: NewsCardProps) {
  return (
    <div className="relative flex flex-col overflow-hidden bg-card border border-border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 rounded-2xl">
      {isAdmin && (
        <Link
          href={`/news/${item.id}?edit=1`}
          className="absolute right-3 top-3 z-20 inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-full bg-black/70 text-white hover:bg-black/90 shadow"
        >
          Edit
        </Link>
      )}

      <div className="relative w-full h-52 overflow-hidden">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            className="object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-gray-500 text-sm">
            No image
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-grow space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
          {item.title}
        </h3>
        <p
          className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.description) }}
        />
      </div>

      <div className="px-5 pb-5 pt-0 mt-auto flex justify-between items-center text-sm">
        <span className="text-gray-400 dark:text-gray-500">
          {newsDateFormatter
            ? newsDateFormatter.format(new Date(item.publishedAt))
            : new Date(item.publishedAt).toISOString().slice(0, 10)}
        </span>
        <Link
          href={`/news/${item.id}`}
          className="font-medium text-primary hover:text-primary/80"
        >
          READ MORE →
        </Link>
      </div>
    </div>
  );
}