// Flags a Species as sensitive and withholds the location of all its Sightings.
//
//   pnpm mark-sensitive powowl1
import { applySensitivity } from '../src/lib/sightings.ts';
import {
  readAllPhotos,
  readAllSpecies,
  readSightings,
  writeSightings,
  writeSpecies,
} from './lib/store.ts';

const code = process.argv[2];
const species = await readAllSpecies();
const sp = code ? species[code] : undefined;
if (!sp) {
  console.error('Usage: pnpm mark-sensitive <species code on the Life List>');
  process.exit(1);
}
await writeSpecies({ ...sp, sensitive: true });
const photos = await readAllPhotos();
const before = await readSightings();
const after = applySensitivity(before, {
  sensitiveSpecies: new Set([sp.code]),
  nestSightings: new Set(
    photos.filter((p) => p.isNest).map((p) => p.sightingId),
  ),
});
await writeSightings(after);
const changed = after.filter((s, i) => s !== before[i]).length;
console.log(
  `${sp.commonName} is now sensitive. Withheld ${changed} Sighting location(s).`,
);
