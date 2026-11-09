import { describe, expect, it } from 'vitest';
import { bestPhoto, lifeList } from './lifelist';
import type { Sighting, Species } from './types';

const sp = (code: string, taxonOrder: number): Species => ({
  code,
  taxonOrder,
  scientificName: code,
  commonName: code,
  family: 'f',
  familyCommonName: 'f',
});
const species = {
  emu1: sp('emu1', 10),
  laukoo1: sp('laukoo1', 9001),
  ausmag2: sp('ausmag2', 12000),
};

const s = (id: string, speciesCode: string, eventDate: string): Sighting => ({
  id,
  origin: 'ebird',
  speciesCode,
  eventDate,
  countryCode: 'AU',
  sensitive: false,
  location: { dataGeneralizations: '' },
});

describe('lifeList', () => {
  it('lists each Species once, in taxonomic order, with first-seen date and Sighting count', () => {
    const list = lifeList(
      [
        s('a', 'ausmag2', '2024-05-01'),
        s('b', 'laukoo1', '2025-01-01'),
        s('c', 'ausmag2', '2023-02-10'),
        s('d', 'emu1', '2022-12-31'),
      ],
      species,
    );
    expect(list).toEqual([
      { speciesCode: 'emu1', firstSeen: '2022-12-31', sightingCount: 1 },
      { speciesCode: 'laukoo1', firstSeen: '2025-01-01', sightingCount: 1 },
      { speciesCode: 'ausmag2', firstSeen: '2023-02-10', sightingCount: 2 },
    ]);
  });
});

describe('bestPhoto', () => {
  const photos = [
    { id: 'old', takenAt: '2023-01-01T06:00:00' },
    { id: 'new', takenAt: '2025-06-01T06:00:00' },
    { id: 'mid', takenAt: '2024-01-01T06:00:00' },
  ];

  it("uses Tim's pick when one is set", () => {
    expect(bestPhoto(photos, 'old')?.id).toBe('old');
  });

  it('falls back to the most recent Photo', () => {
    expect(bestPhoto(photos)?.id).toBe('new');
  });

  it('falls back when the pick no longer exists', () => {
    expect(bestPhoto(photos, 'deleted')?.id).toBe('new');
  });

  it('is undefined for a Species with no Photo', () => {
    expect(bestPhoto([])).toBeUndefined();
  });
});
