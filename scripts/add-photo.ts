// Adds one or more Photos to the site. See docs/adding-photos.md.
//
//   pnpm add-photo ~/Pictures/export/IMG_1234.jpg [more files...]
//
// For each file: reads EXIF, asks for Species, Plumage Color and the rest,
// attaches the Photo to an eBird Sighting from the same day (or makes a Photo
// Sighting), writes web derivatives and uploads them to R2.
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { confirm, input, search, select } from '@inquirer/prompts';
import exifr from 'exifr';
import { countryName, stateName } from '../src/lib/regions.ts';
import { findMatchingSightings } from '../src/lib/sightings.ts';
import {
  PLUMAGE_COLORS,
  type ExactLocation,
  type Species,
} from '../src/lib/types.ts';
import { makeDerivatives } from './lib/derivatives.ts';
import { planPhoto } from './lib/plan-photo.ts';
import { r2Configured, upload } from './lib/r2.ts';
import {
  DATA,
  LOCAL_IMAGES,
  loadTaxonomy,
  readAllSpecies,
  readExactLocations,
  readOriginals,
  readSightings,
  speciesStub,
  writeExactLocations,
  writeOriginals,
  writePhoto,
  writeSightings,
  writeSpecies,
  type PhotoFile,
} from './lib/store.ts';

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: pnpm add-photo <image file> [more image files]');
  process.exit(1);
}

const taxonomy = await loadTaxonomy();
const allSpecies = taxonomy.all();

const pad = (n: number) => String(n).padStart(2, '0');
/** EXIF dates have no timezone; exifr builds them in local time, so read them back in local time. */
const localIso = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

const shutter = (s: number) => (s >= 1 ? `${s}` : `1/${Math.round(1 / s)}`);

type Geo = { countryCode?: string; stateProvince?: string; place?: string };

/** Suggests country, state and a place name from coordinates (OpenStreetMap Nominatim). */
async function reverseGeocode(lat: number, lon: number): Promise<Geo> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&lat=${lat}&lon=${lon}`,
      {
        headers: {
          'User-Agent': 'tim-birds-cli (https://github.com/TimmDay/tim-birds)',
        },
      },
    );
    if (!res.ok) return {};
    const body = (await res.json()) as {
      name?: string;
      address?: Record<string, string>;
    };
    const a = body.address ?? {};
    const place = body.name || a.suburb || a.town || a.village || a.city;
    return {
      countryCode: a.country_code?.toUpperCase(),
      stateProvince: a['ISO3166-2-lvl4'],
      ...(place ? { place } : {}),
    };
  } catch {
    return {};
  }
}

for (const file of files) {
  const path = resolve(file);
  console.log(`\n— ${basename(path)}`);
  const original = await readFile(path);
  const sha256 = createHash('sha256').update(original).digest('hex');
  const originals = await readOriginals();
  const already = Object.entries(originals).find(
    ([, o]) => o.sha256 === sha256,
  );
  if (already) {
    console.log(`Already added as ${already[0]}. Skipping.`);
    continue;
  }

  const exif = ((await exifr.parse(original, {
    gps: true,
    xmp: false,
    iptc: false,
  })) ?? {}) as Record<string, unknown>;
  const lifeListSpecies = await readAllSpecies();

  // Species: Life List Species first, then the rest of the taxonomy.
  const speciesCode = await search<string>({
    message: 'Species',
    source: (term) => {
      const t = (term ?? '').toLowerCase();
      const matches = (s: Species) =>
        s.commonName.toLowerCase().includes(t) ||
        s.scientificName.toLowerCase().includes(t);
      const mine = Object.values(lifeListSpecies).filter(matches);
      const others =
        t.length >= 3
          ? allSpecies.filter((s) => !lifeListSpecies[s.code] && matches(s))
          : [];
      return [...mine, ...others].slice(0, 30).map((s) => ({
        name: `${s.commonName} (${s.scientificName})${lifeListSpecies[s.code] ? '' : '  [not on Life List]'}`,
        value: s.code,
      }));
    },
  });
  const sp =
    lifeListSpecies[speciesCode] ?? speciesStub(taxonomy.byCode(speciesCode)!);

  const taken =
    exif.DateTimeOriginal instanceof Date
      ? localIso(exif.DateTimeOriginal)
      : `${await input({
          message: 'No capture date in EXIF. Date taken (YYYY-MM-DD)',
          validate: (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) || 'Use YYYY-MM-DD',
        })}T00:00:00`;
  const date = taken.slice(0, 10);

  const sightings = await readSightings();
  const candidates = findMatchingSightings(sightings, speciesCode, date);
  let matchSightingId: string | undefined;
  if (candidates.length) {
    matchSightingId = await select<string | undefined>({
      message: `Attach to a Sighting of ${sp.commonName} on ${date}?`,
      choices: [
        ...candidates.map((s) => ({
          name: `${s.origin === 'ebird' ? `eBird ${s.ebirdChecklistId}` : s.id} · ${s.eventTime ?? ''} ${s.location.locality ?? (s.stateProvince ? stateName(s.stateProvince) : '')}`,
          value: s.id,
        })),
        { name: 'None of these: make a Photo Sighting', value: undefined },
      ],
    });
  }

  let exact: ExactLocation = {};
  let countryCode = '';
  let stateProvince: string | undefined;
  if (!matchSightingId) {
    const lat = typeof exif.latitude === 'number' ? exif.latitude : undefined;
    const lon = typeof exif.longitude === 'number' ? exif.longitude : undefined;
    let geo: Geo = {};
    if (lat !== undefined && lon !== undefined) {
      exact = { lat, lon };
      geo = await reverseGeocode(lat, lon);
    } else {
      const typed = await input({
        message: 'No GPS in EXIF. Coordinates "lat, lon" (blank to skip)',
        validate: (v) =>
          v.trim() === '' ||
          /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(v.trim()) ||
          'e.g. -27.47, 153.01',
      });
      if (typed.trim()) {
        const [a, b] = typed.split(',').map((x) => Number(x.trim()));
        exact = { lat: a, lon: b };
        geo = await reverseGeocode(a!, b!);
      }
    }
    countryCode = (
      await input({
        message: 'Country code (ISO, e.g. AU)',
        default: geo.countryCode,
        validate: (v) => /^[A-Za-z]{2}$/.test(v) || 'Two letters',
      })
    ).toUpperCase();
    const st = await input({
      message: `State code (e.g. ${countryCode}-QLD; blank if none)`,
      default: geo.stateProvince,
    });
    stateProvince = st.trim() ? st.trim().toUpperCase() : undefined;
    const place = await input({
      message: 'Place (optional, e.g. "Lamington NP, O\'Reilly\'s")',
      default: geo.place,
    });
    if (place.trim()) exact.place = place.trim();
    console.log(
      `  ${[place, stateProvince && stateName(stateProvince), countryName(countryCode)].filter(Boolean).join(', ')}`,
    );
  }

  const primary = await select({
    message: 'Plumage Color: primary (the bird, not the background)',
    choices: PLUMAGE_COLORS.map((c) => ({ name: c, value: c })),
  });
  const secondary = await select<string | undefined>({
    message: 'Plumage Color: secondary',
    choices: [
      { name: 'none', value: undefined },
      ...PLUMAGE_COLORS.filter((c) => c !== primary).map((c) => ({
        name: c,
        value: c,
      })),
    ],
  });
  const isNest = await confirm({
    message: 'Does the photo show a nest? (makes the Sighting sensitive)',
    default: false,
  });
  const alt = await input({
    message: 'Alt text: what the photo shows, for screen readers',
    default: `${sp.commonName}`,
    validate: (v) => v.trim().length > 0 || 'Required',
  });
  const caption = await input({ message: 'Caption (optional)' });

  const photoId = `${date}-${speciesCode}-${sha256.slice(0, 4)}`;
  const plan = planPhoto(sightings, {
    photoId,
    speciesCode,
    takenAt: taken,
    countryCode,
    ...(stateProvince ? { stateProvince } : {}),
    exact,
    isNest,
    speciesSensitive: sp.sensitive,
    ...(matchSightingId ? { matchSightingId } : {}),
  });

  console.log('  Making web sizes…');
  const key = `p/${photoId}`;
  const d = await makeDerivatives(original, key, LOCAL_IMAGES);

  const camera: Record<string, string | number> = {};
  const body = [exif.Make, exif.Model]
    .filter((x) => typeof x === 'string')
    .join(' ')
    .trim();
  if (body) camera.body = body;
  if (typeof exif.LensModel === 'string') camera.lens = exif.LensModel;
  if (typeof exif.FocalLength === 'number')
    camera.focalLengthMm = Math.round(exif.FocalLength);
  if (typeof exif.FNumber === 'number') camera.aperture = exif.FNumber;
  if (typeof exif.ExposureTime === 'number')
    camera.shutter = shutter(exif.ExposureTime);
  if (typeof exif.ISO === 'number') camera.iso = exif.ISO;

  const photo: PhotoFile = {
    id: photoId,
    sightingId: plan.sightingId,
    takenAt: taken,
    plumage: { primary, ...(secondary ? { secondary } : {}) },
    isNest,
    alt: alt.trim(),
    ...(caption.trim() ? { caption: caption.trim() } : {}),
    image: {
      key,
      width: d.width,
      height: d.height,
      widths: d.widths,
      placeholder: d.placeholder,
    },
    ...(Object.keys(camera).length ? { camera } : {}),
  };

  if (r2Configured()) {
    console.log(`  Uploading ${d.files.length} files to R2…`);
    await upload(d.files);
  } else {
    console.log(
      '  R2 is not set up yet (see issue #5): kept locally in public/p/. Run `pnpm sync-photos` later.',
    );
  }

  await writeSightings(plan.sightings);
  if (plan.exactLocation) {
    const { sightingId, ...loc } = plan.exactLocation;
    const all = await readExactLocations();
    all[sightingId] = loc;
    await writeExactLocations(all);
  }
  if (!lifeListSpecies[speciesCode]) await writeSpecies(sp);
  await writePhoto(photo);
  originals[photoId] = { path, sha256 };
  await writeOriginals(originals);

  console.log(
    `  Added ${photoId} → ${plan.sightingId}${existsSync(join(DATA, 'photos', `${photoId}.json`)) ? '' : ' (not written?)'}`,
  );
}
console.log(
  '\nDone. Preview with `pnpm dev`, then commit data/ (never private/).',
);
