import type { ExactLocation, PublishedLocation } from './types.ts';

/** Half the diagonal of a 0.1° cell is about 7.9 km at the equator; 10 km is a safe upper bound. */
const ROUNDED_UNCERTAINTY_M = 10000;

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * The Published Location for a Sighting. A Sensitive Sighting publishes no
 * coordinates and no Place: country and state (kept on the Sighting) only.
 */
export function publishLocation(
  exact: ExactLocation,
  isSensitive: boolean,
): PublishedLocation {
  if (isSensitive) return withheldLocation();
  return {
    decimalLatitude: round1(exact.lat),
    decimalLongitude: round1(exact.lon),
    coordinateUncertaintyInMeters: ROUNDED_UNCERTAINTY_M,
    ...(exact.place ? { locality: exact.place } : {}),
    dataGeneralizations: 'Coordinates rounded to 0.1 degrees.',
  };
}

/** The Published Location of every Sensitive Sighting: no coordinates, no Place. */
export function withheldLocation(): PublishedLocation {
  return {
    dataGeneralizations:
      'Coordinates and locality withheld (sensitive species or nest). Country and state only.',
  };
}
