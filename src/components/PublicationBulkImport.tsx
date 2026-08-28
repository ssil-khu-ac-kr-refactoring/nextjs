'use client';

import { useState } from 'react';
import {
  normalizePublicationTitle,
  PUBLICATION_CATEGORY_LABELS,
  validatePublicationImport,
  type PublicationCategory,
  type ValidatedPublicationImport,
} from '@/lib/publications';

const CSV_COLUMNS = ['title', 'authors', 'venue', 'year', 'month', 'url', 'pdfUrl', 'category'] as const;

type ExistingPublication = {
  title: string;
  year: number;
};

type PreviewRow = {
  rowNumber: number;
  data: ValidatedPublicationImport;
  errors: string[];
  warnings: string[];
};

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (character !== '\r') {
      field += character;
    }
  }

  if (quoted) throw new Error('CSV contains an unclosed quoted field.');
  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export default function PublicationBulkImport({
  existingPublications,
  onImported,
}: {
  existingPublications: ExistingPublication[];
  onImported: () => Promise<void>;
}) {
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [inputKey, setInputKey] = useState(0);

  async function handleFile(file: File | undefined) {
    setPreviewRows([]);
    setFileError(null);
    setImportError(null);
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

      const existingKeys = new Set(
        existingPublications.map(
          (publication) => `${normalizePublicationTitle(publication.title)}::${publication.year}`,
        ),
      );
      const csvKeys = new Set<string>();
      const nextRows = parsed
        .slice(1)
        .filter((values) => values.some((value) => value.trim()))
        .map((values, index) => {
          const candidate = Object.fromEntries(
            CSV_COLUMNS.map((column) => [column, values[headers.indexOf(column)] ?? '']),
          );
          const validation = validatePublicationImport(candidate);
          const duplicateKey = `${normalizePublicationTitle(validation.data.title)}::${validation.data.year}`;
          const warnings: string[] = [];

          if (validation.data.title && Number.isSafeInteger(validation.data.year)) {
            if (existingKeys.has(duplicateKey)) {
              warnings.push('Possible duplicate of an existing publication.');
            }
            if (csvKeys.has(duplicateKey)) {
              warnings.push('Possible duplicate within this CSV.');
            }
            csvKeys.add(duplicateKey);
          }

          return {
            rowNumber: index + 2,
            data: validation.data,
            errors: validation.errors,
            warnings,
          };
        });

      if (nextRows.length === 0) throw new Error('CSV has no data rows.');
      setPreviewRows(nextRows);
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Failed to parse CSV.');
    }
  }

  async function handleImport() {
    if (previewRows.length === 0 || previewRows.some((row) => row.errors.length > 0)) return;
    setIsImporting(true);
    setImportError(null);

    try {
      const response = await fetch('/api/publications/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: previewRows.map((row) => row.data) }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Bulk import failed.');

      await onImported();
      setPreviewRows([]);
      setInputKey((value) => value + 1);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Bulk import failed.');
    } finally {
      setIsImporting(false);
    }
  }

  const hasErrors = previewRows.some((row) => row.errors.length > 0);

  return (
    <section className="mb-8 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">CSV Bulk Import</h2>
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
      {importError && <p className="mt-4 text-sm text-red-600">{importError}</p>}

      {previewRows.length > 0 && (
        <div className="mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Previewing {previewRows.length} row{previewRows.length === 1 ? '' : 's'}.
              {hasErrors ? ' Fix validation errors in the CSV before importing.' : ''}
            </p>
            <button
              type="button"
              onClick={() => void handleImport()}
              disabled={hasErrors || isImporting}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isImporting ? 'Importing...' : `Import ${previewRows.length} Rows`}
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Row</th>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Authors</th>
                  <th className="px-3 py-2">Year/Month</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Validation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {previewRows.map((row) => (
                  <tr key={row.rowNumber} className={row.errors.length > 0 ? 'bg-red-500/5' : undefined}>
                    <td className="px-3 py-3 align-top">{row.rowNumber}</td>
                    <td className="max-w-xs px-3 py-3 align-top">{row.data.title || '—'}</td>
                    <td className="max-w-xs px-3 py-3 align-top">{row.data.authors || '—'}</td>
                    <td className="whitespace-nowrap px-3 py-3 align-top">
                      {Number.isFinite(row.data.year) ? row.data.year : '—'}
                      {row.data.month ? `/${String(row.data.month).padStart(2, '0')}` : ''}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 align-top">
                      {(PUBLICATION_CATEGORY_LABELS[row.data.category as PublicationCategory] ?? row.data.category) || '—'}
                    </td>
                    <td className="min-w-64 px-3 py-3 align-top">
                      {row.errors.map((error) => (
                        <p key={error} className="text-red-600">{error}</p>
                      ))}
                      {row.warnings.map((warning) => (
                        <p key={warning} className="text-amber-600">Warning: {warning}</p>
                      ))}
                      {row.errors.length === 0 && row.warnings.length === 0 && (
                        <span className="text-green-600">Ready</span>
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
