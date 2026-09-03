"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type LatestNewsItem = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  publishedAt: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  timeZone: "UTC",
});

export default function LatestNewsSlider({ items }: { items: LatestNewsItem[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const multiple = items.length > 1;
  const goTo = useCallback((index: number) => {
    setCurrent((index + items.length) % items.length);
  }, [items.length]);

  useEffect(() => {
    if (!multiple || paused) return;
    const timer = window.setInterval(() => setCurrent((value) => (value + 1) % items.length), 6000);
    return () => window.clearInterval(timer);
  }, [items.length, multiple, paused]);

  useEffect(() => setCurrent(0), [items]);

  if (items.length === 0) return null;

  return (
    <aside
      aria-label="Latest news"
      className="relative z-30 mx-6 mt-10 w-[calc(100%-3rem)] max-w-[28rem] shrink-0 overflow-hidden rounded-2xl border border-white/20 bg-black/55 text-white shadow-2xl backdrop-blur-md lg:absolute lg:bottom-10 lg:right-12 lg:mx-0 lg:mt-0 lg:w-[26rem] lg:max-w-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <div className="flex items-center justify-between border-b border-white/15 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">Latest News</p>
        {multiple && (
          <div className="flex gap-1">
            <button type="button" onClick={() => goTo(current - 1)} aria-label="Previous news" className="rounded-full p-1.5 text-white/80 hover:bg-white/15 hover:text-white">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => goTo(current + 1)} aria-label="Next news" className="rounded-full p-1.5 text-white/80 hover:bg-white/15 hover:text-white">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="grid">
        {items.map((item, index) => (
          <Link
            key={item.id}
            href={`/news/${item.id}`}
            aria-hidden={index !== current}
            tabIndex={index === current ? 0 : -1}
            className={`col-start-1 row-start-1 grid min-h-60 grid-cols-[8.5rem_1fr] transition-opacity duration-500 motion-reduce:transition-none sm:grid-cols-[10rem_1fr] ${index === current ? "z-10 opacity-100" : "pointer-events-none opacity-0"}`}
          >
            <div className="relative min-h-60 bg-white/10">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt="" fill sizes="120px" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs uppercase tracking-widest text-white/45">SSIL</div>
              )}
            </div>
            <div className="flex min-w-0 flex-col p-5">
              <h2 className="line-clamp-3 text-base font-semibold leading-snug">{item.title}</h2>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/70">{item.description}</p>
              <time className="mt-auto block pt-4 text-xs text-white/50" dateTime={item.publishedAt}>
                {dateFormatter.format(new Date(item.publishedAt))}
              </time>
            </div>
          </Link>
        ))}
      </div>

      {multiple && (
        <div className="flex justify-center gap-2 border-t border-white/10 py-2.5">
          {items.map((item, index) => (
            <button key={item.id} type="button" onClick={() => goTo(index)} aria-label={`Show news ${index + 1}`} aria-current={index === current ? "true" : undefined} className={`h-1.5 rounded-full transition-all ${index === current ? "w-5 bg-white" : "w-1.5 bg-white/35 hover:bg-white/60"}`} />
          ))}
        </div>
      )}
    </aside>
  );
}
