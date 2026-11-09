// Domain types. Words match GLOSSARY.md.

/** eBird/Clements species code, e.g. "laukoo1". */
export type SpeciesCode = string;

export const PLUMAGE_COLORS = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'brown',
  'black',
  'white',
  'grey',
  'pink',
] as const;
export type PlumageColor = (typeof PLUMAGE_COLORS)[number];

export const HABITATS = [
  'forest',
  'woodland',
  'grassland',
  'wetland',
  'coastal',
  'marine',
  'arid',
  'urban',
] as const;
export type Habitat = (typeof HABITATS)[number];

export const DIETS = [
  'insects',
  'other invertebrates',
  'fish',
  'seeds',
  'fruit',
  'nectar',
  'vertebrates',
  'carrion',
  'omnivore',
] as const;
export type Diet = (typeof DIETS)[number];

export const NEST_TYPES = [
  'cup',
  'hollow',
  'burrow',
  'platform',
  'ground scrape',
  'mound',
  'dome',
  'none',
] as const;
export type NestType = (typeof NEST_TYPES)[number];

/** The true coordinates of a Sighting. Private: lives only in private/, never committed. */
export type ExactLocation = {
  /** Absent when the camera recorded no GPS and Tim gave none. */
  lat?: number;
  lon?: number;
  place?: string;
};

/** The generalised position the public sees. Darwin Core field names. */
export type PublishedLocation = {
  decimalLatitude?: number;
  decimalLongitude?: number;
  coordinateUncertaintyInMeters?: number;
  locality?: string;
  dataGeneralizations: string;
};

export type Sighting = {
  id: string;
  origin: 'ebird' | 'photo';
  speciesCode: SpeciesCode;
  /** YYYY-MM-DD */
  eventDate: string;
  /** HH:MM, 24 hour */
  eventTime?: string;
  /** ISO 3166-1 alpha-2, e.g. "AU" */
  countryCode: string;
  /** ISO 3166-2, e.g. "AU-QLD" */
  stateProvince?: string;
  individualCount?: number;
  ebirdChecklistId?: string;
  sensitive: boolean;
  location: PublishedLocation;
};

export type Species = {
  code: SpeciesCode;
  scientificName: string;
  commonName: string;
  family: string;
  familyCommonName: string;
  /** eBird taxonomic sort order. */
  taxonOrder: number;
};

export type Photo = {
  id: string;
  sightingId: string;
  /** ISO date-time the shutter fired, from EXIF. */
  takenAt: string;
  plumage: { primary: PlumageColor; secondary?: PlumageColor };
  isNest: boolean;
  alt: string;
};
