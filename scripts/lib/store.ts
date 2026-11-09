// Reads and writes the committed data (data/) and the private files (private/).
// Only the CLI touches these; the site reads data/ through content collections.
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createTaxonomy, type Taxonomy } from '../../src/lib/taxonomy.ts';
import type { ExactLocation, Sighting, Species } from '../../src/lib/types.ts';

export const ROOT = new URL('../..', import.meta.url).pathname;
export const DATA = join(ROOT, 'data');
/** Git-ignored (ADR 0003). Back it up separately. */
export const PRIVATE = join(ROOT, 'private');
/** Local copies of the derivatives, served in dev before R2 is set up. Git-ignored. */
export const LOCAL_IMAGES = join(ROOT, 'public');

const json = (v: unknown) => `${JSON.stringify(v, null, 2)}\n`;

async function readJson<T>(path: string, fallback: T): Promise<T> {
  if (!existsSync(path)) return fallback;
  return JSON.parse(await readFile(path, 'utf8')) as T;
}

async function writeJson(path: string, value: unknown) {
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, json(value));
}

export const loadTaxonomy = async (): Promise<Taxonomy> =>
  createTaxonomy(
    await readFile(join(ROOT, 'scripts/data/ebird-taxonomy.csv'), 'utf8'),
  );

export const readSightings = () =>
  readJson<Sighting[]>(join(DATA, 'sightings.json'), []);
export const writeSightings = (s: Sighting[]) =>
  writeJson(
    join(DATA, 'sightings.json'),
    [...s].sort(
      (a, b) =>
        a.eventDate.localeCompare(b.eventDate) || a.id.localeCompare(b.id),
    ),
  );

export type SpeciesFile = Species & {
  nickname?: string;
  indigenousNames: {
    name: string;
    language: string;
    languageCode?: string;
    source: string;
  }[];
  sensitive: boolean;
  bestPhotoId?: string;
  naturalHistory?: Record<string, unknown>;
  sources: { title: string; url: string }[];
};

const speciesPath = (code: string) => join(DATA, 'species', `${code}.json`);

export async function readAllSpecies(): Promise<Record<string, SpeciesFile>> {
  const dir = join(DATA, 'species');
  if (!existsSync(dir)) return {};
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json'));
  const all = await Promise.all(
    files.map((f) => readJson<SpeciesFile>(join(dir, f), undefined as never)),
  );
  return Object.fromEntries(all.map((s) => [s.code, s]));
}

export const writeSpecies = (s: SpeciesFile) =>
  writeJson(speciesPath(s.code), s);

/** A Species file with taxonomy fields only, for a Species new to the Life List. */
export const speciesStub = (t: Species): SpeciesFile => ({
  ...t,
  indigenousNames: [],
  sensitive: false,
  sources: [
    {
      title: 'eBird/Clements taxonomy',
      url: 'https://www.birds.cornell.edu/clementschecklist/',
    },
  ],
});

export type PhotoFile = {
  id: string;
  sightingId: string;
  takenAt: string;
  plumage: { primary: string; secondary?: string };
  isNest: boolean;
  alt: string;
  caption?: string;
  image: {
    key: string;
    width: number;
    height: number;
    widths: number[];
    placeholder: string;
  };
  camera?: Record<string, string | number>;
};

export async function readAllPhotos(): Promise<PhotoFile[]> {
  const dir = join(DATA, 'photos');
  if (!existsSync(dir)) return [];
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json'));
  return Promise.all(
    files.map((f) => readJson<PhotoFile>(join(dir, f), undefined as never)),
  );
}

export const writePhoto = (p: PhotoFile) =>
  writeJson(join(DATA, 'photos', `${p.id}.json`), p);

type ExactLocations = Record<string, ExactLocation>;
const exactPath = join(PRIVATE, 'exact-locations.json');
export const readExactLocations = () => readJson<ExactLocations>(exactPath, {});
export const writeExactLocations = (e: ExactLocations) =>
  writeJson(exactPath, e);

type Originals = Record<string, { path: string; sha256: string }>;
const originalsPath = join(PRIVATE, 'originals.json');
export const readOriginals = () => readJson<Originals>(originalsPath, {});
export const writeOriginals = (o: Originals) => writeJson(originalsPath, o);

type PlaceOverrides = Record<string, string | null>;
export const PLACE_OVERRIDES_PATH = join(PRIVATE, 'place-overrides.json');
export const readPlaceOverrides = () =>
  readJson<PlaceOverrides>(PLACE_OVERRIDES_PATH, {});
