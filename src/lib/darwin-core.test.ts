import { describe, expect, it } from 'vitest';
import { toDarwinCore, toTsv } from './darwin-core';
import type { Photo, Sighting, Species } from './types';

const kookaburra: Species = {
  code: 'laukoo1',
  scientificName: 'Dacelo novaeguineae',
  commonName: 'Laughing Kookaburra',
  family: 'Alcedinidae',
  familyCommonName: 'Kingfishers',
  taxonOrder: 9001,
};

const open: Sighting = {
  id: 'ebird-S100-laukoo1',
  origin: 'ebird',
  speciesCode: 'laukoo1',
  eventDate: '2025-09-14',
  eventTime: '06:45',
  countryCode: 'AU',
  stateProvince: 'AU-QLD',
  individualCount: 2,
  ebirdChecklistId: 'S100',
  sensitive: false,
  location: {
    decimalLatitude: -28.2,
    decimalLongitude: 153.1,
    coordinateUncertaintyInMeters: 10000,
    locality: "O'Reilly's, Lamington NP",
    dataGeneralizations: 'Coordinates rounded to 0.1 degrees.',
  },
};

const hidden: Sighting = {
  id: 'photo-2025-10-01-laukoo1',
  origin: 'photo',
  speciesCode: 'laukoo1',
  eventDate: '2025-10-01',
  countryCode: 'AU',
  stateProvince: 'AU-NSW',
  sensitive: true,
  location: { dataGeneralizations: 'Withheld.' },
};

const photo: Photo = {
  id: 'p1',
  sightingId: 'ebird-S100-laukoo1',
  takenAt: '2025-09-14T06:52:10',
  plumage: { primary: 'brown', secondary: 'white' },
  isNest: false,
  alt: 'A kookaburra on a branch',
};

const config = {
  siteUrl: 'https://tim-bird.pages.dev',
  recordedBy: 'Tim Day',
  imageUrl: (p: Photo) => `https://img.example/${p.id}/2000.jpg`,
};

describe('toDarwinCore', () => {
  const { occurrences, multimedia } = toDarwinCore(
    [open, hidden],
    [photo],
    { laukoo1: kookaburra },
    config,
  );

  it('maps a Sighting to a Darwin Core Occurrence', () => {
    expect(occurrences[0]).toEqual({
      occurrenceID: 'https://tim-bird.pages.dev/sightings/ebird-S100-laukoo1',
      basisOfRecord: 'HumanObservation',
      occurrenceStatus: 'present',
      recordedBy: 'Tim Day',
      individualCount: '2',
      eventDate: '2025-09-14T06:45',
      scientificName: 'Dacelo novaeguineae',
      vernacularName: 'Laughing Kookaburra',
      taxonRank: 'species',
      kingdom: 'Animalia',
      class: 'Aves',
      family: 'Alcedinidae',
      countryCode: 'AU',
      country: 'Australia',
      stateProvince: 'Queensland',
      locality: "O'Reilly's, Lamington NP",
      decimalLatitude: '-28.2',
      decimalLongitude: '153.1',
      geodeticDatum: 'WGS84',
      coordinateUncertaintyInMeters: '10000',
      dataGeneralizations: 'Coordinates rounded to 0.1 degrees.',
      associatedMedia: 'https://img.example/p1/2000.jpg',
      license: 'http://creativecommons.org/licenses/by-nc/4.0/legalcode',
      rightsHolder: 'Tim Day',
      dynamicProperties: '{"ebirdChecklistId":"S100"}',
    });
  });

  it('publishes no coordinates or locality for a Sensitive Sighting', () => {
    const row = occurrences[1];
    expect(row).toMatchObject({
      stateProvince: 'New South Wales',
      dataGeneralizations: 'Withheld.',
    });
    expect(row?.decimalLatitude).toBe('');
    expect(row?.locality).toBe('');
    expect(row?.geodeticDatum).toBe('');
    expect(row?.dynamicProperties).toBe('');
  });

  it('maps each Photo to a Simple Multimedia row on its Occurrence', () => {
    expect(multimedia).toEqual([
      {
        coreid: 'https://tim-bird.pages.dev/sightings/ebird-S100-laukoo1',
        type: 'StillImage',
        format: 'image/jpeg',
        identifier: 'https://img.example/p1/2000.jpg',
        references: 'https://tim-bird.pages.dev/photos/p1/',
        title: 'Laughing Kookaburra',
        description: 'A kookaburra on a branch',
        created: '2025-09-14T06:52:10',
        creator: 'Tim Day',
        license: 'http://creativecommons.org/licenses/by-nc/4.0/legalcode',
        rightsHolder: 'Tim Day',
      },
    ]);
  });
});

describe('toTsv', () => {
  it('writes a header row and escapes tabs and newlines', () => {
    expect(
      toTsv([
        { a: '1', b: 'x\ty' },
        { a: '2', b: 'line\nbreak' },
      ]),
    ).toBe('a\tb\n1\tx y\n2\tline break\n');
  });
});
