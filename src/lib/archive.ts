// Builds the Darwin Core Archive from the site's data. Build time only.
import { strToU8, zipSync } from 'fflate';
import { IMAGE_BASE, PHOTOGRAPHER, SITE_NAME, SITE_URL } from '../config.ts';
import { getData } from './data.ts';
import {
  MULTIMEDIA_TERMS,
  OCCURRENCE_TERMS,
  toDarwinCore,
  toTsv,
} from './darwin-core.ts';
import { emlXml, metaXml } from './dwca.ts';
import { imageUrl, widthAtMost } from './images.ts';

export const ARCHIVE_PATH = '/data/tim-bird-dwca.zip';

export async function darwinCore() {
  const { sightings, photos, species } = await getData();
  const base = IMAGE_BASE.startsWith('http') ? IMAGE_BASE : SITE_URL;
  return toDarwinCore(sightings, photos, species, {
    siteUrl: SITE_URL,
    recordedBy: PHOTOGRAPHER,
    imageUrl: (p) => {
      const photo = photos.find((x) => x.id === p.id);
      return photo
        ? imageUrl(base, photo.image, widthAtMost(photo.image, 1600))
        : '';
    },
  });
}

export async function buildArchive(): Promise<Uint8Array> {
  const { occurrences, multimedia } = await darwinCore();
  return zipSync({
    'occurrence.txt': strToU8(toTsv(occurrences, OCCURRENCE_TERMS)),
    'multimedia.txt': strToU8(toTsv(multimedia, MULTIMEDIA_TERMS)),
    'meta.xml': strToU8(metaXml()),
    'eml.xml': strToU8(
      emlXml({
        title: `${SITE_NAME}: ${PHOTOGRAPHER}'s bird Sightings and Photos`,
        creator: PHOTOGRAPHER,
        abstract:
          'Personal bird observations (eBird checklists and photo-only Sightings) with photographs. Coordinates are rounded to 0.1 degrees; Sensitive Sightings publish country and state only.',
        pubDate: new Date().toISOString().slice(0, 10),
        url: SITE_URL,
      }),
    ),
  });
}
