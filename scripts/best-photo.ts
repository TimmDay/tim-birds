// Picks the Best Photo for a Species (otherwise the most recent Photo is used).
//
//   pnpm best-photo            choose interactively
//   pnpm best-photo laukoo1    choose for one Species
import { search, select } from '@inquirer/prompts';
import {
  readAllPhotos,
  readAllSpecies,
  readSightings,
  writeSpecies,
} from './lib/store.ts';

const species = await readAllSpecies();
const sightings = await readSightings();
const photos = await readAllPhotos();
const speciesOf = new Map(sightings.map((s) => [s.id, s.speciesCode]));

const code =
  process.argv[2] ??
  (await search<string>({
    message: 'Species',
    source: (term) =>
      Object.values(species)
        .filter((s) =>
          photos.some((p) => speciesOf.get(p.sightingId) === s.code),
        )
        .filter((s) =>
          s.commonName.toLowerCase().includes((term ?? '').toLowerCase()),
        )
        .map((s) => ({ name: s.commonName, value: s.code })),
  }));
const sp = species[code];
if (!sp) {
  console.error(`No Species ${code} on the Life List.`);
  process.exit(1);
}
const mine = photos
  .filter((p) => speciesOf.get(p.sightingId) === code)
  .sort((a, b) => b.takenAt.localeCompare(a.takenAt));
if (mine.length === 0) {
  console.error(`No Photos of ${sp.commonName} yet.`);
  process.exit(1);
}
const pick = await select<string | undefined>({
  message: `Best Photo of ${sp.commonName}`,
  choices: [
    { name: 'Automatic: the most recent Photo', value: undefined },
    ...mine.map((p) => ({
      name: `${p.id}  ${p.alt}${p.id === sp.bestPhotoId ? '  (current)' : ''}`,
      value: p.id,
    })),
  ],
});
const next = { ...sp };
if (pick) next.bestPhotoId = pick;
else delete next.bestPhotoId;
await writeSpecies(next);
console.log(
  pick
    ? `Best Photo of ${sp.commonName}: ${pick}`
    : `${sp.commonName} uses its most recent Photo.`,
);
