// Schemas for the committed data in data/ (or demo-data/). Astro validates
// every file against these at build time, so a bad file fails CI.
import { z } from 'astro/zod';
import { DIETS, HABITATS, NEST_TYPES, PLUMAGE_COLORS } from './types.ts';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');
const onTenthGrid = (n: number) => Math.abs(n * 10 - Math.round(n * 10)) < 1e-9;
const tenthDegree = z
  .number()
  .refine(
    onTenthGrid,
    'must be rounded to 0.1 degrees: Exact Locations never go in the repo (ADR 0003)',
  );

export const sightingSchema = z
  .object({
    id: z.string(),
    origin: z.enum(['ebird', 'photo']),
    speciesCode: z.string(),
    eventDate: isoDate,
    eventTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .optional(),
    countryCode: z.string().length(2),
    stateProvince: z.string().optional(),
    individualCount: z.number().int().positive().optional(),
    ebirdChecklistId: z.string().optional(),
    sensitive: z.boolean(),
    location: z.object({
      decimalLatitude: tenthDegree.optional(),
      decimalLongitude: tenthDegree.optional(),
      coordinateUncertaintyInMeters: z.number().optional(),
      locality: z.string().optional(),
      dataGeneralizations: z.string(),
    }),
  })
  .refine(
    (s) =>
      !s.sensitive ||
      (s.location.decimalLatitude === undefined &&
        s.location.decimalLongitude === undefined &&
        s.location.locality === undefined),
    {
      message:
        'a Sensitive Sighting must not publish coordinates or a Place (ADR 0003)',
    },
  );

const range = z.tuple([z.number(), z.number()]);

export const speciesSchema = z.object({
  code: z.string(),
  scientificName: z.string(),
  commonName: z.string(),
  family: z.string(),
  familyCommonName: z.string(),
  taxonOrder: z.number(),
  nickname: z.string().optional(),
  indigenousNames: z
    .array(
      z.object({
        name: z.string(),
        language: z.string(),
        /** AIATSIS code, where one applies. */
        languageCode: z.string().optional(),
        source: z.string(),
      }),
    )
    .default([]),
  /** Sensitive species: every Sighting of it publishes country and state only. */
  sensitive: z.boolean().default(false),
  bestPhotoId: z.string().optional(),
  naturalHistory: z
    .object({
      habitat: z.array(z.enum(HABITATS)).min(1),
      diet: z.array(z.enum(DIETS)).min(1),
      nestType: z.enum(NEST_TYPES),
      wingspanCm: range.optional(),
      lengthCm: range.optional(),
      clutch: range.optional(),
      iucn: z
        .enum(['LC', 'NT', 'VU', 'EN', 'CR', 'EW', 'EX', 'DD', 'NE'])
        .optional(),
      migration: z
        .enum(['resident', 'partial migrant', 'migrant', 'nomadic'])
        .optional(),
      range: z.string().optional(),
      flavour: z.string().optional(),
      /** Set once Tim has checked a drafted card. Unreviewed cards show a note. */
      reviewed: z.boolean().default(false),
    })
    .optional(),
  sources: z.array(z.object({ title: z.string(), url: z.url() })).default([]),
});

export const photoSchema = z.object({
  id: z.string(),
  sightingId: z.string(),
  takenAt: z.string(),
  plumage: z.object({
    primary: z.enum(PLUMAGE_COLORS),
    secondary: z.enum(PLUMAGE_COLORS).optional(),
  }),
  isNest: z.boolean().default(false),
  alt: z.string().min(1),
  caption: z.string().optional(),
  image: z.object({
    /** Object key prefix on R2, e.g. "photos/2025-09-14-laukoo1-a1b2". */
    key: z.string(),
    width: z.number().int(),
    height: z.number().int(),
    widths: z.array(z.number().int()).min(1),
    /** Tiny blurred WebP as a data URI, shown while the real image loads. */
    placeholder: z.string().startsWith('data:image/'),
  }),
  camera: z
    .object({
      body: z.string().optional(),
      lens: z.string().optional(),
      focalLengthMm: z.number().optional(),
      aperture: z.number().optional(),
      shutter: z.string().optional(),
      iso: z.number().optional(),
    })
    .optional(),
});
