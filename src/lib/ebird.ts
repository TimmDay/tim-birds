import { parse } from 'csv-parse/sync';
import type { ExactLocation, Sighting, Species } from './types';

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
export function parseEbirdExport(
  csv: string,
  resolveSpecies: (scientificName: string) => Species | undefined,
): ImportedSighting[] {
  const rows: Row[] = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  const out: ImportedSighting[] = [];
  for (const row of rows) {
    const species = resolveSpecies(row['Scientific Name'] ?? '');
    if (!species) continue;

    const checklist = row['Submission ID'] ?? '';
    const state = row['State/Province'] ?? '';
    const count = Number(row['Count']);
    const time = to24h(row['Time'] ?? '');
    const place = row['Location'];

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
