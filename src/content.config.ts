import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { photoSchema, sightingSchema, speciesSchema } from './lib/schema.ts';

// Demo data only with DEMO=true (dev, preview). Production always reads data/.
const dir = process.env.DEMO === 'true' ? 'demo-data' : 'data';

const species = defineCollection({
  loader: glob({ pattern: '*.json', base: `${dir}/species` }),
  schema: speciesSchema,
});

const sightings = defineCollection({
  loader: file(`${dir}/sightings.json`),
  schema: sightingSchema,
});

const photos = defineCollection({
  loader: glob({ pattern: '*.json', base: `${dir}/photos` }),
  schema: photoSchema,
});

export const collections = { species, sightings, photos };
