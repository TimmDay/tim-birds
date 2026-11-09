import { describe, expect, it } from 'vitest';
import {
  EMPTY_FILTERS,
  filterPhotos,
  filtersFromSearch,
  filtersToSearch,
  type Filters,
  type GalleryPhoto,
} from './filters.ts';

const photo = (id: string, over: Partial<GalleryPhoto>): GalleryPhoto => ({
  id,
  speciesCode: 'laukoo1',
  countryCode: 'AU',
  stateProvince: 'AU-QLD',
  takenAt: '2025-01-01T06:00:00',
  plumage: ['brown'],
  taxonOrder: 9001,
  ...over,
});

const photos = [
  photo('kook-qld-2025', {}),
  photo('lorikeet-nsw-2024', {
    speciesCode: 'railor5',
    stateProvince: 'AU-NSW',
    takenAt: '2024-03-01T07:00:00',
    plumage: ['green', 'blue'],
    taxonOrder: 7000,
  }),
  photo('robin-nz-2023', {
    speciesCode: 'nezrob2',
    countryCode: 'NZ',
    stateProvince: 'NZ-WGN',
    takenAt: '2023-11-01T07:00:00',
    plumage: ['grey'],
    taxonOrder: 13000,
  }),
];
const ids = (ps: GalleryPhoto[]) => ps.map((p) => p.id);

describe('filterPhotos', () => {
  it('shows everything, newest first, with no filters', () => {
    expect(ids(filterPhotos(photos, EMPTY_FILTERS))).toEqual([
      'kook-qld-2025',
      'lorikeet-nsw-2024',
      'robin-nz-2023',
    ]);
  });

  it('ORs choices within one filter', () => {
    expect(
      ids(filterPhotos(photos, { ...EMPTY_FILTERS, color: ['blue', 'grey'] })),
    ).toEqual(['lorikeet-nsw-2024', 'robin-nz-2023']);
  });

  it('matches a Plumage Color on either primary or secondary', () => {
    expect(
      ids(filterPhotos(photos, { ...EMPTY_FILTERS, color: ['blue'] })),
    ).toEqual(['lorikeet-nsw-2024']);
  });

  it('ANDs across filters', () => {
    const f: Filters = {
      ...EMPTY_FILTERS,
      color: ['blue', 'brown'],
      year: [2025],
    };
    expect(ids(filterPhotos(photos, f))).toEqual(['kook-qld-2025']);
  });

  it('filters by country and state', () => {
    expect(
      ids(filterPhotos(photos, { ...EMPTY_FILTERS, country: ['NZ'] })),
    ).toEqual(['robin-nz-2023']);
    expect(
      ids(filterPhotos(photos, { ...EMPTY_FILTERS, state: ['AU-NSW'] })),
    ).toEqual(['lorikeet-nsw-2024']);
  });

  it('sorts taxonomically when asked', () => {
    expect(
      ids(filterPhotos(photos, { ...EMPTY_FILTERS, sort: 'taxonomic' })),
    ).toEqual(['lorikeet-nsw-2024', 'kook-qld-2025', 'robin-nz-2023']);
  });
});

describe('filters in the URL', () => {
  it('round-trips through a query string', () => {
    const f: Filters = {
      species: ['laukoo1', 'railor5'],
      country: ['AU'],
      state: ['AU-QLD'],
      year: [2024, 2025],
      color: ['blue'],
      sort: 'taxonomic',
    };
    const search = filtersToSearch(f);
    expect(search).toBe(
      '?species=laukoo1,railor5&country=AU&state=AU-QLD&year=2024,2025&color=blue&sort=taxonomic',
    );
    expect(filtersFromSearch(search)).toEqual(f);
  });

  it('writes nothing for empty filters and ignores junk on read', () => {
    expect(filtersToSearch(EMPTY_FILTERS)).toBe('');
    expect(
      filtersFromSearch('?year=abc,2025&color=chartreuse,red&sort=wrong'),
    ).toEqual({
      ...EMPTY_FILTERS,
      year: [2025],
      color: ['red'],
    });
  });
});
