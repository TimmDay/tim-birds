import { parse } from 'csv-parse/sync';
import type { ExactLocation, Sighting, Species } from './types.ts';

/** One row of Tim's eBird "Download My Data" export, ready to become an eBird Sighting. */
export type ImportedSighting = Pick<
  Sighting,
  | 'id'
  | 'speciesCode'
  | 'ebirdChecklistId'
  | 'eventDate'
  | 'eventTime'
  | 'countryCode'
  | 'stateProvince'
  | 'individualCount'
> & { exact: ExactLocation };

type Row = Record<string, string>;

/** "05:10 PM" → "17:10". */
function to24h(time: string): string | undefined {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time.trim());
  if (!m) return undefined;
  let h = Number(m[1]) % 12;
  if (m[3]?.toUpperCase() === 'PM') h += 12;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}

/**
 * Parses an eBird export. `resolveSpecies` maps an eBird scientific name to the
 * Species it counts as (see taxonomy.ts); rows that are not a Species are dropped.
 */
/** eBird Location name → the Place to publish instead, or null to publish none. Lives in private/. */
export type PlaceOverrides = Record<string, string | null>;

const REQUIRED = [
  'Submission ID',
  'Scientific Name',
  'Count',
  'State/Province',
  'Location',
  'Latitude',
  'Longitude',
  'Date',
  'Time',
];

export function parseEbirdExport(
  csv: string,
  resolveSpecies: (scientificName: string) => Species | undefined,
  placeOverrides: PlaceOverrides = {},
): ImportedSighting[] {
  const rows: Row[] = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  const found = Object.keys(rows[0] ?? {});
  const missing = REQUIRED.filter((h) => !found.includes(h));
  if (missing.length) {
    throw new Error(
      `This doesn't look like an eBird "My Data" export. Missing columns: ${missing.join(', ')}. Found: ${found.join(', ')}`,
    );
  }
  const out: ImportedSighting[] = [];
  for (const row of rows) {
    const species = resolveSpecies(row['Scientific Name'] ?? '');
    if (!species) continue;

    const checklist = row['Submission ID'] ?? '';
    const state = row['State/Province'] ?? '';
    const count = Number(row['Count']);
    const time = to24h(row['Time'] ?? '');
    const original = row['Location'] ?? '';
    const place =
      original in placeOverrides ? placeOverrides[original] : original;

    out.push({
      id: `ebird-${checklist}-${species.code}`,
      speciesCode: species.code,
      ebirdChecklistId: checklist,
      eventDate: row['Date'] ?? '',
      ...(time ? { eventTime: time } : {}),
      countryCode: state.split('-')[0] ?? '',
      ...(state.includes('-') ? { stateProvince: state } : {}),
      ...(Number.isInteger(count) && count > 0
        ? { individualCount: count }
        : {}),
      exact: {
        lat: Number(row['Latitude']),
        lon: Number(row['Longitude']),
        ...(place ? { place } : {}),
      },
    });
  }
  return out;
}
