export const PUBLICATION_CATEGORIES = ['SCI', 'OTHER', 'CONFERENCE'] as const;

export type PublicationCategory = (typeof PUBLICATION_CATEGORIES)[number];

export const PUBLICATION_CATEGORY_OPTIONS: ReadonlyArray<{
  value: PublicationCategory;
  label: string;
}> = [
  { value: 'SCI', label: 'SCI(E) Papers' },
  { value: 'OTHER', label: 'Other Publications' },
  { value: 'CONFERENCE', label: 'Conference & Abstracts' },
];

export const PUBLICATION_CATEGORY_LABELS = Object.fromEntries(
  PUBLICATION_CATEGORY_OPTIONS.map(({ value, label }) => [value, label]),
) as Record<PublicationCategory, string>;

export type PublicationImportCandidate = {
  title?: unknown;
  authors?: unknown;
  venue?: unknown;
  year?: unknown;
  month?: unknown;
  url?: unknown;
  pdfUrl?: unknown;
  category?: unknown;
};

export type ValidatedPublicationImport = {
  title: string;
  authors: string;
  venue: string | null;
  year: number;
  month: number | null;
  url: string | null;
  pdfUrl: string | null;
  category: PublicationCategory;
};

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function parseInteger(value: unknown) {
  if (typeof value === 'number') return Number.isSafeInteger(value) ? value : Number.NaN;
  if (typeof value !== 'string' || !/^-?\d+$/.test(value.trim())) return Number.NaN;
  return Number(value.trim());
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function normalizePublicationTitle(title: string) {
  return title.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function validatePublicationImport(candidate: PublicationImportCandidate): {
  data: ValidatedPublicationImport;
  errors: string[];
} {
  const errors: string[] = [];
  const title = typeof candidate.title === 'string' ? candidate.title.trim() : '';
  const authors = typeof candidate.authors === 'string' ? candidate.authors.trim() : '';
  const venue = optionalString(candidate.venue);
  const url = optionalString(candidate.url);
  const pdfUrl = optionalString(candidate.pdfUrl);
  const category = typeof candidate.category === 'string' ? candidate.category.trim() : '';
  const year = parseInteger(candidate.year);
  const monthValue = String(candidate.month ?? '').trim();
  const month = monthValue ? parseInteger(candidate.month) : null;

  if (!title) errors.push('Title is required.');
  if (!authors) errors.push('Authors are required.');
  if (!Number.isSafeInteger(year) || year < 1000 || year > 9999) {
    errors.push('Year must be a four-digit integer.');
  }
  if (month !== null && (!Number.isSafeInteger(month) || month < 1 || month > 12)) {
    errors.push('Month must be blank or an integer from 1 to 12.');
  }
  if (!(PUBLICATION_CATEGORIES as readonly string[]).includes(category)) {
    errors.push('Category must be SCI, OTHER, or CONFERENCE.');
  }
  if (url && !isHttpUrl(url)) errors.push('URL must be a valid http(s) URL.');
  if (pdfUrl && !isHttpUrl(pdfUrl)) errors.push('PDF URL must be a valid http(s) URL.');

  return {
    data: {
      title,
      authors,
      venue,
      year,
      month,
      url,
      pdfUrl,
      category: category as PublicationCategory,
    },
    errors,
  };
}
