'use client';

import { useState } from 'react';
import { toast } from '@/components/Toast';

export type PublicationFormValues = {
  title: string;
  authors: string;
  venue?: string | null;
  year: number;
  month?: number | null;
  url?: string | null;
  pdfUrl?: string | null;
};

export default function PublicationForm({
  initialData,
  onSubmit,
  isSubmitting,
  buttonText,
}: {
  initialData?: PublicationFormValues | null;
  onSubmit: (values: PublicationFormValues) => Promise<void> | void;
  isSubmitting: boolean;
  buttonText: string;
}) {
  const [values, setValues] = useState<PublicationFormValues>({
    title: initialData?.title ?? '',
    authors: initialData?.authors ?? '',
    venue: initialData?.venue ?? '',
    year: initialData?.year ?? new Date().getFullYear(),
    month: initialData?.month ?? null,
    url: initialData?.url ?? '',
    pdfUrl: initialData?.pdfUrl ?? '',
  });

  function set<K extends keyof PublicationFormValues>(k: K, v: PublicationFormValues[K]) {
    setValues((s) => ({ ...s, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!values.title.trim() || !values.authors.trim()) {
      toast.error('title, authors는 필수입니다.');
      return;
    }

    await onSubmit({
      ...values,
      venue: values.venue || null,
      url: values.url || null,
      pdfUrl: values.pdfUrl || null,
      month: values.month ?? null,
    });
  }

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 51 }, (_, i) => currentYear - i);

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-background/10 p-4 rounded"
    >
      <input
        className="p-2 rounded bg-background/20"
        placeholder="Title *"
        value={values.title}
        onChange={(e) => set('title', e.target.value)}
      />
      <input
        className="p-2 rounded bg-background/20"
        placeholder="Authors * (예: A. Lee, B. Kim)"
        value={values.authors}
        onChange={(e) => set('authors', e.target.value)}
      />
      <input
        className="p-2 rounded bg-background/20"
        placeholder="Venue (예: ICML 2025 / Nature)"
        value={values.venue ?? ''}
        onChange={(e) => set('venue', e.target.value)}
      />

      <div className="relative">
        <select
          className="p-2 rounded bg-background/20 w-full appearance-none overflow-y-auto max-h-[200px]"
          value={values.year}
          onChange={(e) => set('year', Number(e.target.value))}
          size={1}
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="relative">
        <select
          className="p-2 rounded bg-background/20 w-full appearance-none overflow-y-auto max-h-[200px]"
          value={values.month ?? ''}
          onChange={(e) => set('month', e.target.value ? Number(e.target.value) : null)}
          size={1}
        >
          <option value="">Month</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {m.toString().padStart(2, '0')}
            </option>
          ))}
        </select>
      </div>

      <input
        className="p-2 rounded bg-background/20"
        placeholder="External URL"
        value={values.url ?? ''}
        onChange={(e) => set('url', e.target.value)}
      />
      <input
        className="p-2 rounded bg-background/20 md:col-span-2"
        placeholder="PDF URL"
        value={values.pdfUrl ?? ''}
        onChange={(e) => set('pdfUrl', e.target.value)}
      />

      <button
        disabled={isSubmitting}
        className="rounded bg-primary text-primary-foreground px-4 py-2 md:col-span-2 disabled:opacity-60"
      >
        {buttonText}
      </button>
    </form>
  );
}