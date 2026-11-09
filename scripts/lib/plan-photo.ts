import { publishLocation, withheldLocation } from '../../src/lib/location.ts';
import type { ExactLocation, Sighting } from '../../src/lib/types.ts';

export type NewPhoto = {
  photoId: string;
  speciesCode: string;
  /** Local date-time from EXIF, "YYYY-MM-DDTHH:MM:SS". */
  takenAt: string;
  countryCode: string;
  stateProvince?: string;
  exact: ExactLocation;
  isNest: boolean;
  speciesSensitive: boolean;
  /** The existing Sighting Tim chose to attach the Photo to, if any. */
  matchSightingId?: string;
};

export type PhotoPlan = {
  sightingId: string;
  sightings: Sighting[];
  /** Set when a new Photo Sighting was made: goes to private/, never the repo. */
  exactLocation?: ExactLocation & { sightingId: string };
};

/**
 * Decides which Sighting a new Photo belongs to (ADR 0001). Joins the chosen
 * Sighting, or makes a Photo Sighting when none fits. A nest Photo or a
 * sensitive Species makes the Sighting sensitive and withholds its location.
 */
export function planPhoto(sightings: Sighting[], photo: NewPhoto): PhotoPlan {
  const sensitive = photo.isNest || photo.speciesSensitive;

  if (photo.matchSightingId) {
    const id = photo.matchSightingId;
    if (!sightings.some((s) => s.id === id))
      throw new Error(`No Sighting ${id}`);
    return {
      sightingId: id,
      sightings: sightings.map((s) =>
        s.id === id && sensitive && !s.sensitive
          ? { ...s, sensitive: true, location: withheldLocation() }
          : s,
      ),
    };
  }

  const id = `photo-${photo.photoId}`;
  const created: Sighting = {
    id,
    origin: 'photo',
    speciesCode: photo.speciesCode,
    eventDate: photo.takenAt.slice(0, 10),
    ...(photo.takenAt.length >= 16
      ? { eventTime: photo.takenAt.slice(11, 16) }
      : {}),
    countryCode: photo.countryCode,
    ...(photo.stateProvince ? { stateProvince: photo.stateProvince } : {}),
    sensitive,
    location: publishLocation(photo.exact, sensitive),
  };
  return {
    sightingId: id,
    sightings: [...sightings, created],
    exactLocation: { sightingId: id, ...photo.exact },
  };
}
