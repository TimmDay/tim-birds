import { describe, expect, it } from 'vitest';
import { sightingSchema } from './schema.ts';

const valid = {
  id: 'ebird-S1-laukoo1',
  origin: 'ebird',
  speciesCode: 'laukoo1',
  eventDate: '2025-09-14',
  countryCode: 'AU',
  stateProvince: 'AU-QLD',
  sensitive: false,
  location: {
    decimalLatitude: -28.2,
    decimalLongitude: 153.1,
    coordinateUncertaintyInMeters: 10000,
    locality: 'Lamington NP',
    dataGeneralizations: 'Coordinates rounded to 0.1 degrees.',
  },
};

describe('sightingSchema (ADR 0003 guard)', () => {
  it('accepts a Published Location on the 0.1 degree grid', () => {
    expect(sightingSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects exact coordinates in committed data', () => {
    const leaked = {
      ...valid,
      location: { ...valid.location, decimalLatitude: -28.23456 },
    };
    expect(sightingSchema.safeParse(leaked).success).toBe(false);
  });

  it('rejects a Sensitive Sighting that publishes coordinates or a Place', () => {
    expect(
      sightingSchema.safeParse({ ...valid, sensitive: true }).success,
    ).toBe(false);
    const placeOnly = {
      ...valid,
      sensitive: true,
      location: { locality: 'Nest tree', dataGeneralizations: 'x' },
    };
    expect(sightingSchema.safeParse(placeOnly).success).toBe(false);
  });

  it('rejects a malformed date', () => {
    expect(
      sightingSchema.safeParse({ ...valid, eventDate: '14/09/2025' }).success,
    ).toBe(false);
  });
});
