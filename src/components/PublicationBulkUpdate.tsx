'use client';

import { useState } from 'react';
import {
  parseCsv,
  PUBLICATION_CATEGORY_LABELS,
  validatePublicationUpdate,
  type PublicationCategory,
  type ValidatedPublicationUpdate,
} from '@/lib/publications';

const CSV_COLUMNS = ['id', 'title', 'year', 'month', 'venue', 'url', 'pdfUrl', 'category'] as const;

type ExistingPublication = {
  id: number;
  title: string;
  year: number;
  month?: number | null;
  venue?: string | null;
  url?: string | null;
  pdfUrl?: string | null;
  category: PublicationCategory;
};

type PreviewRow = {
  rowNumber: number;
  data: ValidatedPublicationUpdate;
  existing?: ExistingPublication;
  errors: string[];
  warnings: string[];
  changed: boolean;
  after?: ReturnType<typeof comparableValues>;
};

function comparableValues(publication: ExistingPublication) {
  return {
    year: publication.year,
    month: publication.month ?? null,
    venue: publication.venue ?? null,
    url: publication.url ?? null,
    pdfUrl: publication.pdfUrl ?? null,
    category: publication.category,
  };
}

function applyUpdate(existing: ExistingPublication, update: ValidatedPublicationUpdate) {
  return {
    year: update.year,
    month: update.month ?? existing.month ?? null,
    venue: update.venue ?? existing.venue ?? null,
    url: update.url ?? existing.url ?? null,
    pdfUrl: update.pdfUrl ?? existing.pdfUrl ?? null,
    category: update.category,
  };
}

function formatValue(value: unknown) {
  return value === null || value === undefined || value === '' ? '—' : String(value);
}

export default function PublicationBulkUpdate({
  existingPublications,
  onUpdated,
}: {
  existingPublications: ExistingPublication[];
  onUpdated: () => Promise<void>;
}) {
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [inputKey, setInputKey] = useState(0);

  async function handleFile(file: File | undefined) {
    setPreviewRows([]);
    setFileError(null);
    setUpdateError(null);
    if (!file) return;

    try {
      const parsed = parseCsv(await file.text());
      if (parsed.length === 0) throw new Error('CSV is empty.');
      const headers = parsed[0].map((header, index) =>
        (index === 0 ? header.replace(/^\uFEFF/, '') : header).trim(),
      );
      const missingColumns = CSV_COLUMNS.filter((column) => !headers.includes(column));
      if (missingColumns.length > 0) {
        throw new Error(`Missing CSV columns: ${missingColumns.join(', ')}`);
      }

      const candidates = parsed
        .slice(1)
        .filter((values) => values.some((value) => value.trim()))
        .map((values, index) => ({
          rowNumber: index + 2,
          validation: validatePublicationUpdate(
            Object.fromEntries(
              CSV_COLUMNS.map((column) => [column, values[headers.indexOf(column)] ?? '']),
            ),
          ),
        }));
      if (candidates.length === 0) throw new Error('CSV has no data rows.');

      const idCounts = new Map<number, number>();
      candidates.forEach(({ validation }) => {
        if (Number.isSafeInteger(validation.data.id)) {
          idCounts.set(validation.data.id, (idCounts.get(validation.data.id) ?? 0) + 1);
        }
      });
      const existingById = new Map(existingPublications.map((publication) => [publication.id, publication]));

      setPreviewRows(
        candidates.map(({ rowNumber, validation }) => {
          const existing = existingById.get(validation.data.id);
          const errors = [...validation.errors];
          const warnings: string[] = [];
          if ((idCounts.get(validation.data.id) ?? 0) > 1) {
            errors.push('Duplicate ID within this CSV.');
          }
          if (Number.isSafeInteger(validation.data.id) && !existing) {
            errors.push('Publication ID was not found.');
          }
          if (existing && validation.data.title !== existing.title.trim()) {
            warnings.push(`CSV title differs from the current title: ${existing.title}`);
          }
          const after = existing ? applyUpdate(existing, validation.data) : undefined;
          const changed = existing
            ? JSON.stringify(comparableValues(existing)) !== JSON.stringify(after)
            : false;
          return { rowNumber, data: validation.data, existing, errors, warnings, changed, after };
        }),
      );
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Failed to parse CSV.');
    }
  }

  async function handleUpdate() {
    if (previewRows.length === 0 || previewRows.some((row) => row.errors.length > 0)) return;
    setIsUpdating(true);
    setUpdateError(null);
    try {
      const response = await fetch('/api/publications/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: previewRows.map((row) => row.data) }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Bulk update failed.');
      await onUpdated();
      setPreviewRows([]);
      setInputKey((value) => value + 1);
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'Bulk update failed.');
    } finally {
      setIsUpdating(false);
    }
  }

  const hasErrors = previewRows.some((row) => row.errors.length > 0);
  const changedCount = previewRows.filter((row) => row.changed).length;

  return (
    <section className="mb-8 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">CSV Bulk Update</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Required columns: {CSV_COLUMNS.join(', ')}
          </p>
        </div>
        <input
          key={inputKey}
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => void handleFile(event.target.files?.[0])}
          className="block text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:font-medium file:text-primary"
        />
      </div>

      {fileError && <p className="mt-4 text-sm text-red-600">{fileError}</p>}
      {updateError && <p className="mt-4 text-sm text-red-600">{updateError}</p>}

      {previewRows.length > 0 && (
        <div className="mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Previewing {previewRows.length} rows: {changedCount} update, {previewRows.length - changedCount} skip.
            </p>
            <button
              type="button"
              onClick={() => void handleUpdate()}
              disabled={hasErrors || changedCount === 0 || isUpdating}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUpdating ? 'Updating...' : `Update ${changedCount} Rows`}
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Row / ID</th>
                  <th className="px-3 py-2">Title Check</th>
                  <th className="px-3 py-2">Before</th>
                  <th className="px-3 py-2">After</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {previewRows.map((row) => (
                  <tr key={row.rowNumber} className={row.errors.length > 0 ? 'bg-red-500/5' : undefined}>
                    <td className="whitespace-nowrap px-3 py-3 align-top">{row.rowNumber} / {row.data.id}</td>
                    <td className="max-w-xs px-3 py-3 align-top">{row.data.title || '—'}</td>
                    <td className="min-w-64 px-3 py-3 align-top text-xs">
                      {row.existing ? Object.entries(comparableValues(row.existing)).map(([key, value]) => (
                        <p key={key}><span className="font-medium">{key}:</span> {formatValue(value)}</p>
                      )) : '—'}
                    </td>
                    <td className="min-w-64 px-3 py-3 align-top text-xs">
                      {row.after ? Object.entries(row.after).map(([key, value]) => (
                        <p key={key}><span className="font-medium">{key}:</span> {formatValue(value)}</p>
                      )) : '—'}
                    </td>
                    <td className="min-w-64 px-3 py-3 align-top">
                      {row.errors.map((error) => <p key={error} className="text-red-600">{error}</p>)}
                      {row.warnings.map((warning) => <p key={warning} className="text-amber-600">Warning: {warning}</p>)}
                      {row.errors.length === 0 && (
                        <p className={row.changed ? 'text-green-600' : 'text-muted-foreground'}>
                          {row.changed ? 'Ready to update' : 'Skip — no changes'}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
