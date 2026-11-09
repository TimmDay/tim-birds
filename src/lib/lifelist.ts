import type { Sighting, Species, SpeciesCode } from './types';

export type LifeListEntry = {
  speciesCode: SpeciesCode;
  firstSeen: string;
  sightingCount: number;
};

/** The Life List: every Species with at least one Sighting, in eBird taxonomic order. */
export function lifeList(
  sightings: Sighting[],
  species: Record<SpeciesCode, Species>,
): LifeListEntry[] {
  const entries = new Map<SpeciesCode, LifeListEntry>();
  for (const s of sightings) {
    const e = entries.get(s.speciesCode);
    if (!e) {
      entries.set(s.speciesCode, {
        speciesCode: s.speciesCode,
        firstSeen: s.eventDate,
        sightingCount: 1,
      });
      continue;
    }
    e.sightingCount += 1;
    if (s.eventDate < e.firstSeen) e.firstSeen = s.eventDate;
  }
  const order = (code: SpeciesCode) =>
    species[code]?.taxonOrder ?? Number.MAX_SAFE_INTEGER;
  return [...entries.values()].sort(
    (a, b) => order(a.speciesCode) - order(b.speciesCode),
  );
}

/** The Best Photo of a Species: Tim's pick when set and present, otherwise the most recent. */
export function bestPhoto<P extends { id: string; takenAt: string }>(
  photosOfSpecies: P[],
  pickId?: string,
): P | undefined {
  const picked = pickId
    ? photosOfSpecies.find((p) => p.id === pickId)
    : undefined;
  if (picked) return picked;
  return photosOfSpecies.reduce<P | undefined>(
    (latest, p) => (!latest || p.takenAt > latest.takenAt ? p : latest),
    undefined,
  );
}
