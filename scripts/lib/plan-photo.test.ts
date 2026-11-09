import { describe, expect, it } from 'vitest';
import type { Sighting } from '../../src/lib/types.ts';
import { planPhoto } from './plan-photo.ts';

const ebirdSighting: Sighting = {
  id: 'ebird-S1-tawfro1',
  origin: 'ebird',
  speciesCode: 'tawfro1',
  eventDate: '2025-09-03',
  countryCode: 'AU',
  stateProvince: 'AU-QLD',
  sensitive: false,
  location: {
    decimalLatitude: -27.5,
    decimalLongitude: 153,
    coordinateUncertaintyInMeters: 10000,
    locality: 'Mt Coot-tha',
    dataGeneralizations: 'Coordinates rounded to 0.1 degrees.',
  },
};

const base = {
  photoId: '2025-09-03-tawfro1-ab12',
  speciesCode: 'tawfro1',
  takenAt: '2025-09-03T18:20:41',
  countryCode: 'AU',
  stateProvince: 'AU-QLD',
  exact: { lat: -27.4712, lon: 153.0104, place: 'Mt Coot-tha' },
  isNest: false,
  speciesSensitive: false,
};

describe('planPhoto', () => {
  it('joins the chosen eBird Sighting without changing it', () => {
    const plan = planPhoto([ebirdSighting], {
      ...base,
      matchSightingId: 'ebird-S1-tawfro1',
    });
    expect(plan.sightingId).toBe('ebird-S1-tawfro1');
    expect(plan.sightings).toEqual([ebirdSighting]);
    expect(plan.exactLocation).toBeUndefined();
  });

  it('makes a joined Sighting sensitive when the Photo shows a nest', () => {
    const plan = planPhoto([ebirdSighting], {
      ...base,
      matchSightingId: 'ebird-S1-tawfro1',
      isNest: true,
    });
    const s = plan.sightings[0];
    expect(s?.sensitive).toBe(true);
    expect(s?.location.decimalLatitude).toBeUndefined();
    expect(s?.location.locality).toBeUndefined();
  });

  it('creates a Photo Sighting from EXIF when nothing matches', () => {
    const plan = planPhoto([ebirdSighting], base);
    expect(plan.sightingId).toBe('photo-2025-09-03-tawfro1-ab12');
    expect(plan.sightings).toHaveLength(2);
    expect(plan.sightings.find((s) => s.id === plan.sightingId)).toEqual({
      id: 'photo-2025-09-03-tawfro1-ab12',
      origin: 'photo',
      speciesCode: 'tawfro1',
      eventDate: '2025-09-03',
      eventTime: '18:20',
      countryCode: 'AU',
      stateProvince: 'AU-QLD',
      sensitive: false,
      location: {
        decimalLatitude: -27.5,
        decimalLongitude: 153,
        coordinateUncertaintyInMeters: 10000,
        locality: 'Mt Coot-tha',
        dataGeneralizations: 'Coordinates rounded to 0.1 degrees.',
      },
    });
    expect(plan.exactLocation).toEqual({
      sightingId: 'photo-2025-09-03-tawfro1-ab12',
      ...base.exact,
    });
  });

  it('withholds a new Photo Sighting of a sensitive Species', () => {
    const plan = planPhoto([], { ...base, speciesSensitive: true });
    expect(plan.sightings[0]?.sensitive).toBe(true);
    expect(plan.sightings[0]?.location.decimalLatitude).toBeUndefined();
    expect(plan.exactLocation?.lat).toBe(-27.4712);
  });
});
