'use client';

import { useMemo, useState } from 'react';
import { parseCsv, type PublicationCategory } from '@/lib/publications';

const MANIFEST_COLUMNS = ['sourceId', 'title', 'year', 'venue', 'filename'] as const;
const MAX_PDF_SIZE = 10 * 1024 * 1024;

type ExistingPublication = {
  id: number;
  title: string;
  authors: string;
  venue?: string | null;
  year: number;
  month?: number | null;
  url?: string | null;
  pdfUrl?: string | null;
  category: PublicationCategory;
};

type ManifestRow = {
  rowNumber: number;
  sourceId: string;
  title: string;
  year: number;
  venue: string;
  filename: string;
};

type RowStatus =
  | 'Ready'
  | 'Already attached'
  | 'Publication not found'
  | 'Duplicate Publication match'
  | 'PDF file missing'
  | 'Duplicate filename in manifest'
  | 'Duplicate selected PDF filename'
  | 'Invalid PDF'
  | 'File too large'
  | 'Uploaded & attached'
  | 'Upload failed'
  | 'Attach failed';

type RowResult = { status: RowStatus; detail?: string };
type PreviewRow = ManifestRow & {
  publication?: ExistingPublication;
  file?: File;
  status: RowStatus;
  detail?: string;
};

function normalizeTitle(title: string) {
  return title.trim().replace(/\s+/g, ' ');
}

function countNames(names: string[]) {
  const counts = new Map<string, number>();
  names.forEach((name) => counts.set(name, (counts.get(name) ?? 0) + 1));
  return counts;
}

function statusClass(status: RowStatus) {
  if (status === 'Ready') return 'text-green-600';
  if (status === 'Uploaded & attached') return 'text-emerald-600';
  if (status === 'Already attached') return 'text-muted-foreground';
  return 'text-red-600';
}

export default function PublicationBulkPdfAttach({
  existingPublications,
  onUpdated,
}: {
  existingPublications: ExistingPublication[];
  onUpdated: () => Promise<void>;
}) {
  const [manifestRows, setManifestRows] = useState<ManifestRow[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [manifestError, setManifestError] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [results, setResults] = useState<Map<number, RowResult>>(new Map());
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [summary, setSummary] = useState<{
    total: number;
    attached: number;
    skippedExisting: number;
    failed: number;
  } | null>(null);

  async function handleManifest(file: File | undefined) {
    setManifestRows([]);
    setManifestError(null);
    setRunError(null);
    setResults(new Map());
    setSummary(null);
    if (!file) return;

    try {
      const parsed = parseCsv(await file.text());
      if (parsed.length === 0) throw new Error('Manifest CSV is empty.');
      const headers = parsed[0].map((header, index) =>
        (index === 0 ? header.replace(/^\uFEFF/, '') : header).trim(),
      );
      const missingColumns = MANIFEST_COLUMNS.filter((column) => !headers.includes(column));
      if (missingColumns.length > 0) {
        throw new Error(`Missing CSV columns: ${missingColumns.join(', ')}`);
      }

      const rows = parsed
        .slice(1)
        .filter((values) => values.some((value) => value.trim()))
        .map((values, index) => {
          const value = (column: (typeof MANIFEST_COLUMNS)[number]) =>
            (values[headers.indexOf(column)] ?? '').trim();
          const yearText = value('year');
          return {
            rowNumber: index + 2,
            sourceId: value('sourceId'),
            title: value('title'),
            year: /^\d{4}$/.test(yearText) ? Number(yearText) : Number.NaN,
            venue: value('venue'),
            filename: value('filename'),
          };
        });
      if (rows.length === 0) throw new Error('Manifest CSV has no data rows.');
      setManifestRows(rows);
    } catch (error) {
      setManifestError(error instanceof Error ? error.message : 'Failed to parse manifest CSV.');
    }
  }

  function handlePdfFiles(files: FileList | null) {
    setSelectedFiles(files ? Array.from(files) : []);
    setRunError(null);
    setResults(new Map());
    setSummary(null);
  }

  const previewRows = useMemo<PreviewRow[]>(() => {
    const manifestFilenameCounts = countNames(manifestRows.map((row) => row.filename).filter(Boolean));
    const selectedFilenameCounts = countNames(selectedFiles.map((file) => file.name));
    const filesByName = new Map<string, File>();
    selectedFiles.forEach((file) => {
      if (!filesByName.has(file.name)) filesByName.set(file.name, file);
    });

    return manifestRows.map((row) => {
      const completed = results.get(row.rowNumber);
      const matches = existingPublications.filter(
        (publication) =>
          publication.category === 'CONFERENCE' &&
          publication.year === row.year &&
          normalizeTitle(publication.title) === normalizeTitle(row.title),
      );
      const publication = matches.length === 1 ? matches[0] : undefined;
      const file = filesByName.get(row.filename);
      let status: RowStatus;

      if (completed) return { ...row, publication, file, ...completed };
      if (row.filename && (manifestFilenameCounts.get(row.filename) ?? 0) > 1) {
        status = 'Duplicate filename in manifest';
      } else if (matches.length === 0) {
        status = 'Publication not found';
      } else if (matches.length > 1) {
        status = 'Duplicate Publication match';
      } else if (publication?.pdfUrl) {
        status = 'Already attached';
      } else if ((selectedFilenameCounts.get(row.filename) ?? 0) > 1) {
        status = 'Duplicate selected PDF filename';
      } else if (!file) {
        status = 'PDF file missing';
      } else if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) {
        status = 'Invalid PDF';
      } else if (file.size > MAX_PDF_SIZE) {
        status = 'File too large';
      } else {
        status = 'Ready';
      }
      return { ...row, publication, file, status };
    });
  }, [existingPublications, manifestRows, results, selectedFiles]);

  const readyRows = previewRows.filter(
    (row): row is PreviewRow & { publication: ExistingPublication; file: File } =>
      row.status === 'Ready' && !!row.publication && !!row.file,
  );

  async function uploadAndAttach() {
    if (isUploading || readyRows.length === 0) return;
    const rowsToProcess = [...readyRows];
    const skippedExisting = previewRows.filter((row) => row.status === 'Already attached').length;
    let attached = 0;
    let processingFailures = 0;
    setIsUploading(true);
    setRunError(null);
    setResults(new Map());
    setSummary(null);
    setProgress({ current: 0, total: rowsToProcess.length });

    for (let index = 0; index < rowsToProcess.length; index += 1) {
      const row = rowsToProcess[index];
      setProgress({ current: index + 1, total: rowsToProcess.length });
      let uploadedPdfUrl: string;

      try {
        const formData = new FormData();
        formData.append('file', row.file);
        const uploadResponse = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadResult = await uploadResponse.json().catch(() => null);
        if (!uploadResponse.ok || typeof uploadResult?.url !== 'string' || !uploadResult.url) {
          throw new Error(
            typeof uploadResult?.error === 'string'
              ? uploadResult.error
              : `Upload failed (${uploadResponse.status}).`,
          );
        }
        uploadedPdfUrl = uploadResult.url;
      } catch (error) {
        processingFailures += 1;
        setResults((current) => new Map(current).set(row.rowNumber, {
          status: 'Upload failed',
          detail: error instanceof Error ? error.message : 'Upload failed.',
        }));
        continue;
      }

      try {
        const publication = row.publication;
        const attachResponse = await fetch(`/api/publications/${publication.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: publication.title,
            authors: publication.authors,
            venue: publication.venue ?? null,
            year: publication.year,
            month: publication.month ?? null,
            url: publication.url ?? null,
            pdfUrl: uploadedPdfUrl,
            category: publication.category,
          }),
        });
        if (!attachResponse.ok) {
          const attachResult = await attachResponse.json().catch(() => null);
          throw new Error(
            typeof attachResult?.error === 'string'
              ? attachResult.error
              : `HTTP ${attachResponse.status}`,
          );
        }

        attached += 1;
        setResults((current) => new Map(current).set(row.rowNumber, { status: 'Uploaded & attached' }));
      } catch (error) {
        processingFailures += 1;
        setResults((current) => new Map(current).set(row.rowNumber, {
          status: 'Attach failed',
          detail: `${error instanceof Error ? error.message : 'Attach failed.'} Uploaded file may be orphaned.`,
        }));
      }
    }

    try {
      await onUpdated();
    } catch (error) {
      setRunError(error instanceof Error ? error.message : 'Failed to refresh publications.');
    } finally {
      const validationFailures = previewRows.length - rowsToProcess.length - skippedExisting;
      setSummary({
        total: previewRows.length,
        attached,
        skippedExisting,
        failed: validationFailures + processingFailures,
      });
      setIsUploading(false);
    }
  }

  return (
    <section className="mb-8 rounded-2xl border border-border bg-card p-5">
      <h2 className="text-xl font-semibold">Bulk PDF Attach</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Match existing Conference &amp; Abstracts records with PDF files using a manifest CSV.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium">
          Manifest CSV
          <input type="file" accept=".csv,text/csv" disabled={isUploading}
            onChange={(event) => void handleManifest(event.target.files?.[0])}
            className="mt-2 block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:font-medium file:text-primary disabled:opacity-50" />
        </label>
        <label className="block text-sm font-medium">
          PDF Files
          <input type="file" accept=".pdf,application/pdf" multiple disabled={isUploading}
            onChange={(event) => handlePdfFiles(event.target.files)}
            className="mt-2 block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:font-medium file:text-primary disabled:opacity-50" />
        </label>
      </div>

      {manifestError && <p className="mt-4 text-sm text-red-600">{manifestError}</p>}
      {runError && <p className="mt-4 text-sm text-red-600">{runError}</p>}

      {previewRows.length > 0 && (
        <div className="mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {isUploading ? `Uploading ${progress.current} / ${progress.total}...` : `${readyRows.length} of ${previewRows.length} rows ready.`}
            </p>
            <button type="button" onClick={() => void uploadAndAttach()}
              disabled={manifestRows.length === 0 || selectedFiles.length === 0 || readyRows.length === 0 || isUploading}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">
              {isUploading ? 'Uploading...' : `Upload & Attach ${readyRows.length} PDFs`}
            </button>
          </div>

          {isUploading && (
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-[width]"
                style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }} />
            </div>
          )}

          {summary && (
            <div className="mb-4 flex flex-wrap gap-x-5 gap-y-1 rounded-xl bg-muted/50 px-4 py-3 text-sm">
              <span>Total: {summary.total}</span>
              <span className="text-green-600">Attached: {summary.attached}</span>
              <span>Skipped existing: {summary.skippedExisting}</span>
              <span className="text-red-600">Failed: {summary.failed}</span>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  {['Source ID', 'Year', 'Title', 'Filename', 'Publication ID', 'Existing PDF', 'File selected', 'Status'].map((heading) => (
                    <th key={heading} className="px-3 py-2">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {previewRows.map((row) => (
                  <tr key={row.rowNumber}>
                    <td className="whitespace-nowrap px-3 py-3 align-top">{row.sourceId || '—'}</td>
                    <td className="whitespace-nowrap px-3 py-3 align-top">{Number.isFinite(row.year) ? row.year : '—'}</td>
                    <td className="min-w-72 max-w-md px-3 py-3 align-top">{row.title || '—'}</td>
                    <td className="whitespace-nowrap px-3 py-3 align-top">{row.filename || '—'}</td>
                    <td className="whitespace-nowrap px-3 py-3 align-top">{row.publication?.id ?? '—'}</td>
                    <td className="max-w-48 truncate px-3 py-3 align-top" title={row.publication?.pdfUrl ?? undefined}>{row.publication?.pdfUrl || '—'}</td>
                    <td className="whitespace-nowrap px-3 py-3 align-top">{row.file ? 'Yes' : 'No'}</td>
                    <td className="min-w-56 px-3 py-3 align-top">
                      <p className={statusClass(row.status)}>{row.status}</p>
                      {row.detail && <p className="mt-1 text-xs text-muted-foreground">{row.detail}</p>}
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
