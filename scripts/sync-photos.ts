// Uploads any local derivatives (public/p/) that R2 does not have yet.
// Use it after setting up R2 if you added Photos before it existed.
//
//   pnpm sync-photos
import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { listKeys, r2Configured, upload, type Upload } from './lib/r2.ts';
import { LOCAL_IMAGES } from './lib/store.ts';

if (!r2Configured()) {
  console.error('R2 is not configured. Fill in .env first (see issue #5).');
  process.exit(1);
}
const dir = join(LOCAL_IMAGES, 'p');
if (!existsSync(dir)) {
  console.log('No local derivatives in public/p/. Nothing to do.');
  process.exit(0);
}
const types: Record<string, string> = {
  avif: 'image/avif',
  webp: 'image/webp',
  jpg: 'image/jpeg',
};
const remote = await listKeys('p/');
const missing: Upload[] = (await readdir(dir))
  .map((name) => ({
    key: `p/${name}`,
    path: join(dir, name),
    contentType: types[name.split('.').pop() ?? ''] ?? '',
  }))
  .filter((f) => f.contentType && !remote.has(f.key));
console.log(
  `${missing.length} files to upload (${remote.size} already on R2).`,
);
await upload(missing);
console.log('Done.');
