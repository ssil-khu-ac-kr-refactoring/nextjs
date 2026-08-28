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

export function parseCsv(text: string) {
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

export type PublicationUpdateCandidate = Omit<PublicationImportCandidate, 'authors'> & {
  id?: unknown;
};

export type ValidatedPublicationUpdate = Omit<
  ValidatedPublicationImport,
  'authors' | 'venue' | 'month' | 'url' | 'pdfUrl'
> & {
  id: number;
  venue?: string;
  month?: number;
  url?: string;
  pdfUrl?: string;
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

export function validatePublicationUpdate(candidate: PublicationUpdateCandidate): {
  data: ValidatedPublicationUpdate;
  errors: string[];
} {
  const id = parseInteger(candidate.id);
  const validation = validatePublicationImport({ ...candidate, authors: 'unchanged' });
  const errors = [...validation.errors];
  if (!Number.isSafeInteger(id) || id <= 0) errors.unshift('ID must be a positive integer.');
  const { authors: _authors, venue, month, url, pdfUrl, ...data } = validation.data;
  const hasValue = (value: unknown) => String(value ?? '').trim().length > 0;

  return {
    data: {
      id,
      ...data,
      venue: hasValue(candidate.venue) ? venue ?? undefined : undefined,
      month: hasValue(candidate.month) ? month ?? undefined : undefined,
      url: hasValue(candidate.url) ? url ?? undefined : undefined,
      pdfUrl: hasValue(candidate.pdfUrl) ? pdfUrl ?? undefined : undefined,
    },
    errors,
  };
}
