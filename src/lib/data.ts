// Loads the content collections and joins them. Build time only.
import { getCollection } from 'astro:content';
import type { GalleryPhoto } from './filters.ts';
import { bestPhoto, lifeList } from './lifelist.ts';
import type { photoSchema, sightingSchema, speciesSchema } from './schema.ts';
import type { z } from 'astro/zod';

export type SpeciesEntry = z.infer<typeof speciesSchema>;
export type SightingEntry = z.infer<typeof sightingSchema>;
export type PhotoEntry = z.infer<typeof photoSchema>;

/** A Photo with the Sighting and Species it inherits from. */
export type PhotoView = PhotoEntry & {
  sighting: SightingEntry;
  species: SpeciesEntry;
};

let cache: Promise<Awaited<ReturnType<typeof load>>> | undefined;

async function load() {
  const [speciesRows, sightingRows, photoRows] = await Promise.all([
    getCollection('species'),
    getCollection('sightings'),
    getCollection('photos'),
  ]);
  const species = Object.fromEntries(
    speciesRows.map((r) => [r.data.code, r.data]),
  );
  const sightings = sightingRows.map((r) => r.data);
  const sightingById = new Map(sightings.map((s) => [s.id, s]));

  const photos: PhotoView[] = photoRows.map(({ data: p }) => {
    const sighting = sightingById.get(p.sightingId);
    if (!sighting)
      throw new Error(`Photo ${p.id}: no Sighting ${p.sightingId}`);
    const sp = species[sighting.speciesCode];
    if (!sp)
      throw new Error(
        `Sighting ${sighting.id}: no Species ${sighting.speciesCode}`,
      );
    // ADR 0003: a nest Photo or a sensitive Species makes its Sighting sensitive.
    if ((p.isNest || sp.sensitive) && !sighting.sensitive) {
      throw new Error(
        `Sighting ${sighting.id} must be sensitive: it has a nest Photo or a sensitive Species`,
      );
    }
    return { ...p, sighting, species: sp };
  });
  photos.sort((a, b) => b.takenAt.localeCompare(a.takenAt));

  for (const s of sightings) {
    if (!species[s.speciesCode])
      throw new Error(`Sighting ${s.id}: no Species ${s.speciesCode}`);
  }

  return { species, sightings, photos, lifeList: lifeList(sightings, species) };
}

export const getData = () => (cache ??= load());

export function photosOf(photos: PhotoView[], code: string) {
  return photos.filter((p) => p.species.code === code);
}

export function bestPhotoOf(photos: PhotoView[], sp: SpeciesEntry) {
  return bestPhoto(photosOf(photos, sp.code), sp.bestPhotoId);
}

export function toGalleryPhoto(p: PhotoView): GalleryPhoto {
  return {
    id: p.id,
    speciesCode: p.species.code,
    countryCode: p.sighting.countryCode,
    ...(p.sighting.stateProvince
      ? { stateProvince: p.sighting.stateProvince }
      : {}),
    takenAt: p.takenAt,
    plumage: [
      p.plumage.primary,
      ...(p.plumage.secondary ? [p.plumage.secondary] : []),
    ],
    taxonOrder: p.species.taxonOrder,
  };
}
