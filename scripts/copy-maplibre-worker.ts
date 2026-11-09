// MapLibre finds its worker through import.meta.url, which bundling breaks, so
// the map never loads its data. Serve the worker (and the shared chunk it
// imports by relative path) as static files, and point MapLibre at them with
// setWorkerUrl(). Same fix as coin-cabinet. Runs on install and before builds.
import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const from = join(root, 'node_modules/maplibre-gl/dist');
const to = join(root, 'public/vendor');
mkdirSync(to, { recursive: true });
for (const f of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs'])
  copyFileSync(join(from, f), join(to, f));
