'use client';

import { useState } from 'react';
import { toast } from '@/components/Toast';
import {
  PUBLICATION_CATEGORY_OPTIONS,
  type PublicationCategory,
} from '@/lib/publications';

export { PUBLICATION_CATEGORY_OPTIONS, type PublicationCategory } from '@/lib/publications';

const MAX_PDF_SIZE = 10 * 1024 * 1024;

export type PublicationFormValues = {
  title: string;
  authors: string;
  venue?: string | null;
  year: number;
  month?: number | null;
  url?: string | null;
  pdfUrl?: string | null;
  category: PublicationCategory;
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
    category: initialData?.category ?? 'SCI',
  });
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

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

  function handlePdfSelection(file: File | null) {
    if (!file) {
      setSelectedPdf(null);
      return true;
    }

    if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) {
      setSelectedPdf(null);
      toast.error('Please select a PDF file.');
      return false;
    }

    if (file.size > MAX_PDF_SIZE) {
      setSelectedPdf(null);
      toast.error('PDF files must be 10MB or smaller.');
      return false;
    }

    setSelectedPdf(file);
    return true;
  }

  async function uploadPdf() {
    if (!selectedPdf || uploadingPdf) return;

    setUploadingPdf(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedPdf);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof result?.error === 'string'
            ? result.error
            : `PDF upload failed (${response.status}).`,
        );
      }
      if (typeof result?.url !== 'string' || !result.url) {
        throw new Error('The upload response did not include a PDF URL.');
      }

      set('pdfUrl', result.url);
      toast.success('PDF uploaded. Save the publication to keep this URL.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'PDF upload failed.');
    } finally {
      setUploadingPdf(false);
    }
  }

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 51 }, (_, i) => currentYear - i);

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-background/10 p-4 rounded"
    >
      <div className="md:col-span-2">
        <label className="block text-sm text-foreground/70 mb-1">분류 (Category)</label>
        <select
          className="p-2 rounded bg-background/20 w-full"
          value={values.category}
          onChange={(e) => set('category', e.target.value as PublicationCategory)}
        >
          {PUBLICATION_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

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
      <div className="space-y-3 md:col-span-2">
        <label className="block text-sm text-foreground/70">
          PDF URL
          <input
            className="mt-1 w-full rounded bg-background/20 p-2"
            placeholder="PDF URL"
            value={values.pdfUrl ?? ''}
            onChange={(e) => set('pdfUrl', e.target.value)}
          />
        </label>

        {values.pdfUrl && (
          <a
            href={values.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-sm font-medium text-primary hover:underline"
          >
            Open current PDF
          </a>
        )}

        <div className="rounded-lg border border-border bg-card/40 p-3">
          <label className="block text-sm font-medium text-foreground">PDF File</label>
          <p className="mt-1 text-xs text-muted-foreground">PDF only, maximum 10MB.</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="file"
              accept=".pdf,application/pdf"
              disabled={uploadingPdf}
              onChange={(event) => {
                if (!handlePdfSelection(event.target.files?.[0] ?? null)) {
                  event.currentTarget.value = '';
                }
              }}
              className="min-w-0 flex-1 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-secondary/80 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={uploadPdf}
              disabled={!selectedPdf || uploadingPdf}
              className="shrink-0 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploadingPdf ? 'Uploading...' : 'Upload PDF'}
            </button>
          </div>
          {selectedPdf && (
            <p className="mt-2 truncate text-xs text-muted-foreground">
              Selected: {selectedPdf.name}
            </p>
          )}
        </div>
      </div>

      <button
        disabled={isSubmitting || uploadingPdf}
        className="rounded bg-primary text-primary-foreground px-4 py-2 md:col-span-2 disabled:opacity-60"
      >
        {buttonText}
      </button>
    </form>
  );
}
