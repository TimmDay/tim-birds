import { countryName, stateName } from './regions';
import type { Photo, Sighting, Species, SpeciesCode } from './types';

export const PHOTO_LICENSE =
  'http://creativecommons.org/licenses/by-nc/4.0/legalcode';

export type DwcConfig = {
  siteUrl: string;
  recordedBy: string;
  imageUrl: (photo: Photo) => string;
};

type Row = Record<string, string>;

/** Darwin Core Occurrence terms, in archive column order. */
export const OCCURRENCE_TERMS = [
  'occurrenceID',
  'basisOfRecord',
  'occurrenceStatus',
  'recordedBy',
  'individualCount',
  'eventDate',
  'scientificName',
  'vernacularName',
  'taxonRank',
  'kingdom',
  'class',
  'family',
  'countryCode',
  'country',
  'stateProvince',
  'locality',
  'decimalLatitude',
  'decimalLongitude',
  'geodeticDatum',
  'coordinateUncertaintyInMeters',
  'dataGeneralizations',
  'associatedMedia',
  'license',
  'rightsHolder',
  'dynamicProperties',
] as const;

/** GBIF Simple Multimedia extension terms, in archive column order. */
export const MULTIMEDIA_TERMS = [
  'coreid',
  'type',
  'format',
  'identifier',
  'references',
  'title',
  'description',
  'created',
  'creator',
  'license',
  'rightsHolder',
] as const;

const str = (v: string | number | undefined) =>
  v === undefined ? '' : String(v);

/** Expresses Sightings (the Occurrence core) and their Photos (multimedia) in Darwin Core. */
export function toDarwinCore(
  sightings: Sighting[],
  photos: Photo[],
  species: Record<SpeciesCode, Species>,
  config: DwcConfig,
): { occurrences: Row[]; multimedia: Row[] } {
  const occurrenceId = (s: Sighting) => `${config.siteUrl}/sightings/${s.id}`;
  const photosBySighting = Map.groupBy(photos, (p) => p.sightingId);
  const sightingById = new Map(sightings.map((s) => [s.id, s]));

  const occurrences = sightings.map((s): Row => {
    const sp = species[s.speciesCode];
    const loc = s.location;
    const hasCoords = loc.decimalLatitude !== undefined;
    return {
      occurrenceID: occurrenceId(s),
      basisOfRecord: 'HumanObservation',
      occurrenceStatus: 'present',
      recordedBy: config.recordedBy,
      individualCount: str(s.individualCount),
      eventDate: s.eventTime ? `${s.eventDate}T${s.eventTime}` : s.eventDate,
      scientificName: str(sp?.scientificName),
      vernacularName: str(sp?.commonName),
      taxonRank: 'species',
      kingdom: 'Animalia',
      class: 'Aves',
      family: str(sp?.family),
      countryCode: s.countryCode,
      country: countryName(s.countryCode),
      stateProvince: s.stateProvince ? stateName(s.stateProvince) : '',
      locality: str(loc.locality),
      decimalLatitude: str(loc.decimalLatitude),
      decimalLongitude: str(loc.decimalLongitude),
      geodeticDatum: hasCoords ? 'WGS84' : '',
      coordinateUncertaintyInMeters: str(loc.coordinateUncertaintyInMeters),
      dataGeneralizations: loc.dataGeneralizations,
      associatedMedia: (photosBySighting.get(s.id) ?? [])
        .map(config.imageUrl)
        .join(' | '),
      license: PHOTO_LICENSE,
      rightsHolder: config.recordedBy,
      // A checklist ID can locate a Sensitive Sighting on eBird, so it is withheld too.
      dynamicProperties:
        s.ebirdChecklistId && !s.sensitive
          ? JSON.stringify({ ebirdChecklistId: s.ebirdChecklistId })
          : '',
    };
  });

  const multimedia = photos.flatMap((p): Row[] => {
    const s = sightingById.get(p.sightingId);
    if (!s) return [];
    return [
      {
        coreid: occurrenceId(s),
        type: 'StillImage',
        format: 'image/jpeg',
        identifier: config.imageUrl(p),
        references: `${config.siteUrl}/photos/${p.id}/`,
        title: str(species[s.speciesCode]?.commonName),
        description: p.alt,
        created: p.takenAt,
        creator: config.recordedBy,
        license: PHOTO_LICENSE,
        rightsHolder: config.recordedBy,
      },
    ];
  });

  return { occurrences, multimedia };
}

/** Tab-separated text with a header row. Tabs and newlines inside values become spaces. */
export function toTsv(rows: Row[], columns?: readonly string[]): string {
  const cols = columns ?? Object.keys(rows[0] ?? {});
  const clean = (v: string | undefined) => (v ?? '').replace(/[\t\r\n]+/g, ' ');
  return [
    cols.join('\t'),
    ...rows.map((r) => cols.map((c) => clean(r[c])).join('\t')),
  ]
    .map((line) => `${line}\n`)
    .join('');
}
