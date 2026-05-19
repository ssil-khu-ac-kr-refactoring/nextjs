"use client";

import { useEffect, useState } from "react";

type ToastType = "success" | "error" | "info";
type ToastItem = { id: number; message: string; type: ToastType };

let counter = 0;
const listeners = new Set<(items: ToastItem[]) => void>();
let items: ToastItem[] = [];

function emit() {
  for (const fn of listeners) fn(items);
}

export function toast(message: string, type: ToastType = "info", durationMs = 3000) {
  const id = ++counter;
  items = [...items, { id, message, type }];
  emit();
  if (typeof window !== "undefined") {
    window.setTimeout(() => {
      items = items.filter((t) => t.id !== id);
      emit();
    }, durationMs);
  }
}

toast.success = (m: string, d?: number) => toast(m, "success", d);
toast.error = (m: string, d?: number) => toast(m, "error", d);
toast.info = (m: string, d?: number) => toast(m, "info", d);

export function Toaster() {
  const [list, setList] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.add(setList);
    return () => {
      listeners.delete(setList);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {list.map((t) => (
        <div
          key={t.id}
          className={[
            "pointer-events-auto px-4 py-3 rounded-2xl shadow-lg border text-sm min-w-[240px] max-w-[360px] backdrop-blur",
            t.type === "success" && "bg-primary/95 text-primary-foreground border-primary/30",
            t.type === "error" && "bg-red-600/95 text-white border-red-400/30",
            t.type === "info" && "bg-zinc-800/95 text-white border-zinc-600/40",
          ]
            .filter(Boolean)
            .join(" ")}
          role="status"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
