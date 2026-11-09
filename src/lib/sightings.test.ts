import { describe, expect, it } from 'vitest';
import { findMatchingSightings, mergeSightings } from './sightings.ts';
import type { Sighting } from './types.ts';

const base = {
  countryCode: 'AU',
  stateProvince: 'AU-QLD',
  sensitive: false,
  location: { dataGeneralizations: 'Coordinates rounded to 0.1 degrees.' },
};
const ebird = (id: string, eventDate: string, count?: number): Sighting => ({
  ...base,
  id,
  origin: 'ebird',
  speciesCode: 'laukoo1',
  eventDate,
  ...(count ? { individualCount: count } : {}),
});
const photoSighting: Sighting = {
  ...base,
  id: 'photo-2025-10-01-laukoo1',
  origin: 'photo',
  speciesCode: 'laukoo1',
  eventDate: '2025-10-01',
};

describe('mergeSightings', () => {
  it('updates a re-imported eBird Sighting instead of duplicating it', () => {
    const merged = mergeSightings(
      [ebird('ebird-S1-laukoo1', '2025-01-01', 1)],
      [ebird('ebird-S1-laukoo1', '2025-01-01', 3)],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]?.individualCount).toBe(3);
  });

  it('never touches Photo Sightings, and keeps eBird Sightings missing from the import', () => {
    const merged = mergeSightings(
      [photoSighting, ebird('ebird-S1-laukoo1', '2025-01-01')],
      [ebird('ebird-S2-laukoo1', '2025-02-01')],
    );
    expect(merged.map((s) => s.id)).toEqual([
      'ebird-S1-laukoo1',
      'ebird-S2-laukoo1',
      'photo-2025-10-01-laukoo1',
    ]);
  });

  it('keeps the sensitive flag already set on an existing Sighting', () => {
    const existing = {
      ...ebird('ebird-S1-laukoo1', '2025-01-01'),
      sensitive: true,
    };
    const [merged] = mergeSightings(
      [existing],
      [ebird('ebird-S1-laukoo1', '2025-01-01')],
    );
    expect(merged?.sensitive).toBe(true);
  });

  it('withholds the location of a re-imported Sighting that was already sensitive', () => {
    const existing = {
      ...ebird('ebird-S1-laukoo1', '2025-01-01'),
      sensitive: true,
    };
    const reimported: Sighting = {
      ...ebird('ebird-S1-laukoo1', '2025-01-01'),
      location: {
        decimalLatitude: -28.2,
        decimalLongitude: 153.1,
        coordinateUncertaintyInMeters: 10000,
        locality: 'Nest tree, Lamington NP',
        dataGeneralizations: 'Coordinates rounded to 0.1 degrees.',
      },
    };
    const [merged] = mergeSightings([existing], [reimported]);
    expect(merged?.location.decimalLatitude).toBeUndefined();
    expect(merged?.location.decimalLongitude).toBeUndefined();
    expect(merged?.location.locality).toBeUndefined();
  });
});

describe('findMatchingSightings', () => {
  it('finds Sightings of the same Species on the same day', () => {
    const all = [
      ebird('ebird-S1-laukoo1', '2025-01-01'),
      ebird('ebird-S2-laukoo1', '2025-01-02'),
    ];
    expect(
      findMatchingSightings(all, 'laukoo1', '2025-01-02').map((s) => s.id),
    ).toEqual(['ebird-S2-laukoo1']);
    expect(findMatchingSightings(all, 'ausmag2', '2025-01-02')).toEqual([]);
  });
});
