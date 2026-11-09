import {
  PLUMAGE_COLORS,
  type PlumageColor,
  type SpeciesCode,
} from './types.ts';

/** A Photo joined with what the gallery filters on (Species, place and time come from its Sighting). */
export type GalleryPhoto = {
  id: string;
  speciesCode: SpeciesCode;
  countryCode: string;
  stateProvince?: string;
  takenAt: string;
  /** Primary first, then the optional secondary. */
  plumage: PlumageColor[];
  taxonOrder: number;
};

export type Sort = 'newest' | 'taxonomic';

export type Filters = {
  species: SpeciesCode[];
  country: string[];
  state: string[];
  year: number[];
  color: PlumageColor[];
  sort: Sort;
};

export const EMPTY_FILTERS: Filters = {
  species: [],
  country: [],
  state: [],
  year: [],
  color: [],
  sort: 'newest',
};

const yearOf = (p: GalleryPhoto) => Number(p.takenAt.slice(0, 4));

/** OR within a filter, AND across filters. An empty filter matches everything. */
export function filterPhotos(
  photos: GalleryPhoto[],
  f: Filters,
): GalleryPhoto[] {
  const any = <T>(chosen: T[], test: (v: T) => boolean) =>
    chosen.length === 0 || chosen.some(test);
  const kept = photos.filter(
    (p) =>
      any(f.species, (s) => s === p.speciesCode) &&
      any(f.country, (c) => c === p.countryCode) &&
      any(f.state, (s) => s === p.stateProvince) &&
      any(f.year, (y) => y === yearOf(p)) &&
      any(f.color, (c) => p.plumage.includes(c)),
  );
  return kept.sort(
    f.sort === 'taxonomic'
      ? (a, b) =>
          a.taxonOrder - b.taxonOrder || b.takenAt.localeCompare(a.takenAt)
      : (a, b) => b.takenAt.localeCompare(a.takenAt),
  );
}

const LIST_KEYS = ['species', 'country', 'state', 'year', 'color'] as const;

/** "?species=a,b&year=2025". Empty filters and the default sort are left out. */
export function filtersToSearch(f: Filters): string {
  const parts: string[] = [];
  for (const key of LIST_KEYS) {
    const values = f[key];
    if (values.length > 0) {
      parts.push(
        `${key}=${values.map((v) => encodeURIComponent(String(v))).join(',')}`,
      );
    }
  }
  if (f.sort !== 'newest') parts.push(`sort=${f.sort}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

/** The inverse of filtersToSearch. Unknown values are dropped rather than failing. */
export function filtersFromSearch(search: string): Filters {
  const params = new URLSearchParams(search);
  const list = (key: string) =>
    (params.get(key) ?? '').split(',').filter(Boolean);
  const colors = new Set<string>(PLUMAGE_COLORS);
  return {
    species: list('species'),
    country: list('country'),
    state: list('state'),
    year: list('year')
      .map(Number)
      .filter((y) => Number.isInteger(y)),
    color: list('color').filter((c): c is PlumageColor => colors.has(c)),
    sort: params.get('sort') === 'taxonomic' ? 'taxonomic' : 'newest',
  };
}
