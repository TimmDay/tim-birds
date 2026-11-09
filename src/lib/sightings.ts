import { withheldLocation } from './location.ts';
import type { Sighting, SpeciesCode } from './types.ts';

const byDateThenId = (a: Sighting, b: Sighting) =>
  a.eventDate.localeCompare(b.eventDate) || a.id.localeCompare(b.id);

/**
 * Merges a fresh eBird import into the existing Sightings. Same id → updated
 * in place, keeping Tim's sensitive flag. Photo Sightings and eBird Sightings
 * absent from the import are kept: an import never deletes.
 */
export function mergeSightings(
  existing: Sighting[],
  imported: Sighting[],
): Sighting[] {
  const byId = new Map(existing.map((s) => [s.id, s]));
  for (const next of imported) {
    const prev = byId.get(next.id);
    if (prev?.origin === 'photo') continue;
    const sensitive = next.sensitive || (prev?.sensitive ?? false);
    byId.set(next.id, {
      ...next,
      sensitive,
      location: sensitive ? withheldLocation() : next.location,
    });
  }
  return [...byId.values()].sort(byDateThenId);
}

/** Candidate Sightings for a new Photo: same Species, same day. */
export function findMatchingSightings(
  sightings: Sighting[],
  speciesCode: SpeciesCode,
  date: string,
): Sighting[] {
  return sightings.filter(
    (s) => s.speciesCode === speciesCode && s.eventDate === date,
  );
}

/**
 * Makes every Sighting of a sensitive Species, and every Sighting with a nest
 * Photo, sensitive with its location withheld. Never un-withholds: clearing a
 * flag needs the Exact Location from private/, so it is a deliberate step.
 */
export function applySensitivity(
  sightings: Sighting[],
  rules: { sensitiveSpecies: Set<SpeciesCode>; nestSightings: Set<string> },
): Sighting[] {
  return sightings.map((s) =>
    !s.sensitive &&
    (rules.sensitiveSpecies.has(s.speciesCode) || rules.nestSightings.has(s.id))
      ? { ...s, sensitive: true, location: withheldLocation() }
      : s,
  );
}
