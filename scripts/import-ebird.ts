// Imports Tim's eBird "Download My Data" CSV as eBird Sightings.
//
//   pnpm import-ebird inbox/MyEBirdData.csv
//
// Safe to re-run: Sightings are keyed on checklist + Species, so a re-import
// updates rather than duplicates. Exact Locations go to private/ only.
import { readFile } from 'node:fs/promises';
import { parse } from 'csv-parse/sync';
import { confirm } from '@inquirer/prompts';
import { parseEbirdExport } from '../src/lib/ebird.ts';
import { lifeList } from '../src/lib/lifelist.ts';
import { publishLocation } from '../src/lib/location.ts';
import { applySensitivity, mergeSightings } from '../src/lib/sightings.ts';
import type { Sighting } from '../src/lib/types.ts';
import {
  loadTaxonomy,
  PLACE_OVERRIDES_PATH,
  readPlaceOverrides,
  readAllPhotos,
  readAllSpecies,
  readExactLocations,
  readSightings,
  speciesStub,
  writeExactLocations,
  writePhoto,
  writeSightings,
  writeSpecies,
} from './lib/store.ts';

const file = process.argv[2];
if (!file) {
  console.error('Usage: pnpm import-ebird <path to MyEBirdData.csv>');
  process.exit(1);
}

const taxonomy = await loadTaxonomy();
const species = await readAllSpecies();
const photos = await readAllPhotos();
const exact = await readExactLocations();
const existing = await readSightings();

const csv = await readFile(file, 'utf8');
const overrides = await readPlaceOverrides();
const imported = parseEbirdExport(csv, taxonomy.resolve, overrides);

// Names the taxonomy has never heard of (not spuhs or hybrids, which are known
// and deliberately skipped). Usually a taxonomy update: refresh scripts/data.
const unknown = new Map<string, number>();
for (const line of parse(csv, {
  columns: true,
  skip_empty_lines: true,
}) as Record<string, string>[]) {
  const name = line['Scientific Name'] ?? '';
  if (!taxonomy.resolve(name) && !taxonomy.knows(name))
    unknown.set(name, (unknown.get(name) ?? 0) + 1);
}
const sensitiveSpecies = new Set(
  Object.values(species)
    .filter((s) => s.sensitive)
    .map((s) => s.code),
);
const nestSightings = new Set(
  photos.filter((p) => p.isNest).map((p) => p.sightingId),
);

const fresh: Sighting[] = imported.map(({ exact: loc, ...row }) => {
  exact[row.id] = loc;
  const sensitive =
    sensitiveSpecies.has(row.speciesCode) || nestSightings.has(row.id);
  return {
    ...row,
    origin: 'ebird',
    sensitive,
    location: publishLocation(loc, sensitive),
  };
});

let sightings = applySensitivity(mergeSightings(existing, fresh), {
  sensitiveSpecies,
  nestSightings,
});

// A Species new to the Life List gets a stub file, ready for its Species Card.
const newSpecies: string[] = [];
for (const s of sightings) {
  if (species[s.speciesCode]) continue;
  const t = taxonomy.byCode(s.speciesCode);
  if (!t) continue;
  species[s.speciesCode] = speciesStub(t);
  await writeSpecies(species[s.speciesCode]!);
  newSpecies.push(t.commonName);
}

// Photo Sightings that an eBird Sighting now covers: offer to merge them.
const ebirdBySpeciesDay = new Map(
  sightings
    .filter((s) => s.origin === 'ebird')
    .map((s) => [`${s.speciesCode}|${s.eventDate}`, s] as const),
);
for (const ps of sightings.filter((s) => s.origin === 'photo')) {
  const match = ebirdBySpeciesDay.get(`${ps.speciesCode}|${ps.eventDate}`);
  if (!match) continue;
  const name = species[ps.speciesCode]?.commonName ?? ps.speciesCode;
  const ok = await confirm({
    message: `${name} on ${ps.eventDate}: move its Photos from Photo Sighting ${ps.id} to eBird checklist ${match.ebirdChecklistId}?`,
    default: true,
  });
  if (!ok) continue;
  for (const p of photos.filter((p) => p.sightingId === ps.id)) {
    await writePhoto({ ...p, sightingId: match.id });
  }
  if (ps.sensitive && !match.sensitive) {
    sightings = applySensitivity(sightings, {
      sensitiveSpecies: new Set(),
      nestSightings: new Set([match.id]),
    });
  }
  sightings = sightings.filter((s) => s.id !== ps.id);
  delete exact[ps.id];
}

await writeSightings(sightings);
await writeExactLocations(exact);

// Every Place about to be public. eBird personal locations ("Home", a street
// address) must be renamed or blanked in private/place-overrides.json.
const places = new Map<string, number>();
for (const s of sightings) {
  const p = s.location.locality;
  if (p) places.set(p, (places.get(p) ?? 0) + 1);
}
console.log(`\nPlaces that will be published (${places.size}):`);
for (const [p, n] of [...places].sort((a, b) => b[1] - a[1]))
  console.log(`  ${String(n).padStart(4)}  ${p}`);
console.log(
  `To rename or hide one, add it to ${PLACE_OVERRIDES_PATH.replace(`${process.cwd()}/`, '')}:\n` +
    '  { "Home": null, "12 Smith St, Ashgrove": "Ashgrove" }\n' +
    'then run this import again.\n',
);

if (unknown.size) {
  console.log(
    'Scientific names not in the vendored eBird taxonomy (rows skipped):',
  );
  for (const [n, c] of unknown) console.log(`  ${c}× ${n}`);
  console.log(
    'If these are real species, the taxonomy in scripts/data/ may need refreshing.\n',
  );
}

const list = lifeList(sightings, species);
console.log(`Imported ${fresh.length} eBird rows.`);
console.log(
  `Sightings: ${sightings.length}. Life List: ${list.length} species.`,
);
if (newSpecies.length)
  console.log(`New to the Life List: ${newSpecies.join(', ')}`);
console.log('Check the Life List count against your eBird life list total.');
