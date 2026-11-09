import { describe, expect, it } from 'vitest';
import { publishLocation } from './location.ts';

const lamington = {
  lat: -28.23456,
  lon: 153.13789,
  place: "O'Reilly's, Lamington NP",
};

describe('publishLocation', () => {
  it('rounds coordinates to 0.1 degrees and keeps the Place', () => {
    expect(publishLocation(lamington, false)).toEqual({
      decimalLatitude: -28.2,
      decimalLongitude: 153.1,
      coordinateUncertaintyInMeters: 10000,
      locality: "O'Reilly's, Lamington NP",
      dataGeneralizations: 'Coordinates rounded to 0.1 degrees.',
    });
  });

  it('withholds coordinates and Place for a Sensitive Sighting', () => {
    expect(publishLocation(lamington, true)).toEqual({
      dataGeneralizations:
        'Coordinates and locality withheld (sensitive species or nest). Country and state only.',
    });
  });

  it('rounds to the nearest tenth, not down', () => {
    const out = publishLocation({ lat: -33.86, lon: 151.21 }, false);
    expect(out.decimalLatitude).toBe(-33.9);
    expect(out.decimalLongitude).toBe(151.2);
    expect(out.locality).toBeUndefined();
  });

  it('publishes only the Place when no coordinates were recorded', () => {
    expect(publishLocation({ place: 'Zealandia' }, false)).toEqual({
      locality: 'Zealandia',
      dataGeneralizations: 'No coordinates recorded.',
    });
  });
});
