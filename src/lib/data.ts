// Loads the content collections and joins them. Build time only.
import { getCollection } from 'astro:content';
import { DEMO, IMAGE_BASE } from '../config.ts';
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

/** Everything a Species Card shows, for one Life List Species. */
export type CardData = {
  speciesCode: string;
  firstSeen: string;
  lastSeen: string;
  sightingCount: number;
  species: SpeciesEntry;
  bestPhoto: PhotoView | undefined;
  photoCount: number;
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

  // On Cloudflare Pages, images must come from R2: fail loudly rather than ship broken images.
  if (process.env.CF_PAGES && !DEMO && photos.length && !IMAGE_BASE) {
    throw new Error(
      'PUBLIC_IMAGE_BASE is not set on Cloudflare Pages (see issue #7).',
    );
  }

  for (const s of sightings) {
    if (!species[s.speciesCode])
      throw new Error(`Sighting ${s.id}: no Species ${s.speciesCode}`);
  }

  const lastSeen = new Map<string, string>();
  for (const s of sightings) {
    if ((lastSeen.get(s.speciesCode) ?? '') < s.eventDate)
      lastSeen.set(s.speciesCode, s.eventDate);
  }
  const cards: CardData[] = lifeList(sightings, species).map((entry) => {
    const sp = species[entry.speciesCode]!;
    return {
      ...entry,
      lastSeen: lastSeen.get(sp.code) ?? entry.firstSeen,
      species: sp,
      bestPhoto: bestPhotoOf(photos, sp),
      photoCount: photosOf(photos, sp.code).length,
    };
  });

  return { species, sightings, photos, cards };
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
