// Writes the demo dataset (demo-data/) and its placeholder images
// (public/demo-images/, git-ignored). Used only with DEMO=true.
//
//   node scripts/make-demo.ts
//
// The images are drawn, not photographed: a gradient, a silhouette and the
// word DEMO, so nobody mistakes them for Tim's work.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { publishLocation } from '../src/lib/location.ts';
import { createTaxonomy } from '../src/lib/taxonomy.ts';
import type { PlumageColor } from '../src/lib/types.ts';
import { makeDerivatives } from './lib/derivatives.ts';

const ROOT = new URL('..', import.meta.url).pathname;
const DATA = join(ROOT, 'demo-data');
const taxonomy = createTaxonomy(
  await readFile(join(ROOT, 'scripts/data/ebird-taxonomy.csv'), 'utf8'),
);

type DemoSpecies = {
  code: string;
  nickname?: string;
  sensitive?: boolean;
  colors: [string, string];
  naturalHistory: Record<string, unknown>;
  indigenousNames?: { name: string; language: string; source: string }[];
};

const wiki = (title: string) => ({
  title: `Wikipedia: ${title.replaceAll('_', ' ')}`,
  url: `https://en.wikipedia.org/wiki/${title}`,
});

const SPECIES: (DemoSpecies & { wiki: string })[] = [
  {
    code: 'laukoo1',
    wiki: 'Laughing_kookaburra',
    nickname: 'The 5am alarm',
    colors: ['#6b5a45', '#d9c8a8'],
    naturalHistory: {
      habitat: ['woodland', 'forest', 'urban'],
      diet: ['vertebrates', 'insects'],
      nestType: 'hollow',
      wingspanCm: [65, 65],
      lengthCm: [39, 42],
      clutch: [2, 4],
      iucn: 'LC',
      migration: 'resident',
      range: 'Eastern Australia; introduced to the south-west and Tasmania.',
      flavour:
        'Family groups laugh together at dawn and dusk to mark their territory.',
      reviewed: true,
    },
  },
  {
    code: 'railor5',
    wiki: 'Rainbow_lorikeet',
    colors: ['#2f6db5', '#3d9a52'],
    naturalHistory: {
      habitat: ['woodland', 'urban', 'coastal'],
      diet: ['nectar', 'fruit'],
      nestType: 'hollow',
      wingspanCm: [42, 46],
      lengthCm: [25, 30],
      clutch: [2, 3],
      iucn: 'LC',
      migration: 'nomadic',
      range: 'Coastal northern and eastern Australia.',
      flavour: 'A brush-tipped tongue mops up nectar and pollen.',
      reviewed: true,
    },
  },
  {
    code: 'supfai1',
    wiki: 'Superb_fairywren',
    colors: ['#2a5fa8', '#1c2333'],
    naturalHistory: {
      habitat: ['woodland', 'urban'],
      diet: ['insects'],
      nestType: 'dome',
      lengthCm: [14, 14],
      clutch: [3, 4],
      iucn: 'LC',
      migration: 'resident',
      range: 'South-eastern Australia and Tasmania.',
      flavour:
        'Males pluck yellow petals and carry them to females in courtship.',
      reviewed: true,
    },
  },
  {
    code: 'ausmag2',
    wiki: 'Australian_magpie',
    nickname: 'Swoopy',
    colors: ['#151515', '#e8e8e8'],
    naturalHistory: {
      habitat: ['grassland', 'woodland', 'urban'],
      diet: ['insects', 'other invertebrates'],
      nestType: 'cup',
      wingspanCm: [65, 85],
      lengthCm: [37, 43],
      clutch: [2, 5],
      iucn: 'LC',
      migration: 'resident',
      range: 'Most of Australia and southern New Guinea.',
      flavour: 'Can mimic more than 35 other species.',
      reviewed: true,
    },
    indigenousNames: [
      {
        name: 'Lorem ipsum',
        language: 'Placeholder language',
        source: 'Demo only: replace with a cited source',
      },
    ],
  },
  {
    code: 'succoc',
    wiki: 'Sulphur-crested_cockatoo',
    colors: ['#f2f0e8', '#e9d36a'],
    naturalHistory: {
      habitat: ['woodland', 'forest', 'urban'],
      diet: ['seeds', 'fruit'],
      nestType: 'hollow',
      wingspanCm: [95, 105],
      lengthCm: [44, 55],
      clutch: [2, 3],
      iucn: 'LC',
      migration: 'resident',
      range: 'Northern and eastern Australia, New Guinea.',
      flavour:
        'Sydney flocks have learned to open wheelie bins, and teach each other.',
      reviewed: true,
    },
  },
  {
    code: 'tawfro1',
    wiki: 'Tawny_frogmouth',
    colors: ['#7d7468', '#3f3a33'],
    naturalHistory: {
      habitat: ['woodland', 'forest', 'urban'],
      diet: ['insects', 'vertebrates'],
      nestType: 'platform',
      lengthCm: [34, 53],
      clutch: [1, 3],
      iucn: 'LC',
      migration: 'resident',
      range: 'Throughout mainland Australia and Tasmania.',
      flavour: 'Freezes with its bill skyward to pass as a broken branch.',
      reviewed: false,
    },
  },
  {
    code: 'powowl1',
    wiki: 'Powerful_owl',
    sensitive: true,
    colors: ['#4a3d33', '#c9b79c'],
    naturalHistory: {
      habitat: ['forest'],
      diet: ['vertebrates'],
      nestType: 'hollow',
      wingspanCm: [112, 135],
      lengthCm: [45, 65],
      clutch: [2, 2],
      iucn: 'LC',
      migration: 'resident',
      range: 'South-eastern and eastern Australia.',
      flavour:
        "Australia's largest owl; pairs hold the same territory for years.",
      reviewed: true,
    },
  },
  {
    code: 'rabeat1',
    wiki: 'Rainbow_bee-eater',
    colors: ['#3a9a6a', '#e5a33a'],
    naturalHistory: {
      habitat: ['grassland', 'woodland', 'coastal'],
      diet: ['insects'],
      nestType: 'burrow',
      lengthCm: [19, 21],
      clutch: [3, 7],
      iucn: 'LC',
      migration: 'partial migrant',
      range: 'Australia; southern birds winter in the north and New Guinea.',
      flavour:
        'Beats bees against a branch to remove the sting before swallowing.',
      reviewed: true,
    },
  },
  {
    code: 'criros2',
    wiki: 'Crimson_rosella',
    colors: ['#b3262e', '#2d58a6'],
    naturalHistory: {
      habitat: ['forest', 'woodland'],
      diet: ['seeds', 'fruit'],
      nestType: 'hollow',
      lengthCm: [32, 37],
      clutch: [4, 8],
      iucn: 'LC',
      migration: 'resident',
      range: 'Eastern and south-eastern Australia.',
      flavour: 'Young birds are mostly green and redden over their first year.',
      reviewed: true,
    },
  },
  {
    code: 'tui1',
    wiki: 'Tui_(bird)',
    colors: ['#1d2a2a', '#e9e9e9'],
    naturalHistory: {
      habitat: ['forest', 'urban'],
      diet: ['nectar', 'fruit', 'insects'],
      nestType: 'cup',
      lengthCm: [27, 32],
      clutch: [2, 4],
      iucn: 'LC',
      migration: 'resident',
      range: 'Throughout New Zealand.',
      flavour: 'Has two voice boxes, so it can sing two notes at once.',
      reviewed: true,
    },
  },
];

type DemoSighting = {
  code: string;
  date: string;
  time: string;
  state: string;
  lat: number;
  lon: number;
  place: string;
  photos?: {
    plumage: [PlumageColor, PlumageColor?];
    alt: string;
    isNest?: boolean;
    portrait?: boolean;
  }[];
};

const SIGHTINGS: DemoSighting[] = [
  {
    code: 'laukoo1',
    date: '2025-09-14',
    time: '06:45',
    state: 'AU-QLD',
    lat: -28.2346,
    lon: 153.1379,
    place: "O'Reilly's, Lamington NP",
    photos: [
      {
        plumage: ['brown', 'white'],
        alt: 'Demo placeholder: kookaburra on a branch',
      },
    ],
  },
  {
    code: 'laukoo1',
    date: '2023-04-02',
    time: '07:10',
    state: 'AU-NSW',
    lat: -33.8981,
    lon: 151.2337,
    place: 'Centennial Park',
    photos: [
      {
        plumage: ['brown', 'white'],
        alt: 'Demo placeholder: kookaburra calling',
        portrait: true,
      },
    ],
  },
  {
    code: 'railor5',
    date: '2024-03-01',
    time: '07:30',
    state: 'AU-NSW',
    lat: -33.8642,
    lon: 151.2166,
    place: 'Royal Botanic Garden',
    photos: [
      {
        plumage: ['green', 'blue'],
        alt: 'Demo placeholder: lorikeet in blossom',
      },
      {
        plumage: ['blue', 'orange'],
        alt: 'Demo placeholder: lorikeet pair',
        portrait: true,
      },
    ],
  },
  {
    code: 'supfai1',
    date: '2024-10-20',
    time: '08:05',
    state: 'AU-VIC',
    lat: -37.7836,
    lon: 144.9514,
    place: 'Royal Park',
    photos: [
      {
        plumage: ['blue', 'black'],
        alt: 'Demo placeholder: male fairywren in breeding plumage',
      },
    ],
  },
  {
    code: 'supfai1',
    date: '2025-05-11',
    time: '09:20',
    state: 'AU-VIC',
    lat: -37.8304,
    lon: 145.0464,
    place: 'Gardiners Creek',
    photos: [{ plumage: ['brown'], alt: 'Demo placeholder: female fairywren' }],
  },
  {
    code: 'ausmag2',
    date: '2023-08-30',
    time: '16:40',
    state: 'AU-ACT',
    lat: -35.2809,
    lon: 149.13,
    place: 'Commonwealth Park',
    photos: [
      {
        plumage: ['black', 'white'],
        alt: 'Demo placeholder: magpie on a lawn',
      },
    ],
  },
  {
    code: 'succoc',
    date: '2025-01-18',
    time: '17:55',
    state: 'AU-NSW',
    lat: -33.7969,
    lon: 151.2877,
    place: 'Manly',
    photos: [
      {
        plumage: ['white', 'yellow'],
        alt: 'Demo placeholder: cockatoo raising its crest',
        portrait: true,
      },
    ],
  },
  {
    code: 'tawfro1',
    date: '2024-09-03',
    time: '18:20',
    state: 'AU-QLD',
    lat: -27.4698,
    lon: 153.0251,
    place: 'Nest tree, private garden',
    photos: [
      {
        plumage: ['grey', 'brown'],
        alt: 'Demo placeholder: frogmouth on its nest',
        isNest: true,
      },
    ],
  },
  {
    code: 'powowl1',
    date: '2025-06-22',
    time: '17:30',
    state: 'AU-NSW',
    lat: -33.7993,
    lon: 151.1543,
    place: 'Roost gully',
    photos: [
      {
        plumage: ['brown', 'white'],
        alt: 'Demo placeholder: powerful owl at roost',
        portrait: true,
      },
    ],
  },
  {
    code: 'rabeat1',
    date: '2025-10-04',
    time: '07:00',
    state: 'AU-NT',
    lat: -12.8641,
    lon: 132.6372,
    place: 'Yellow Water, Kakadu NP',
    photos: [
      {
        plumage: ['green', 'orange'],
        alt: 'Demo placeholder: bee-eater with a dragonfly',
      },
    ],
  },
  {
    code: 'criros2',
    date: '2022-12-28',
    time: '10:15',
    state: 'AU-VIC',
    lat: -37.8536,
    lon: 145.3536,
    place: 'Dandenong Ranges',
  },
  {
    code: 'tui1',
    date: '2023-11-01',
    time: '08:30',
    state: 'NZ-WGN',
    lat: -41.2902,
    lon: 174.7633,
    place: 'Zealandia',
  },
];

function placeholderSvg(
  colors: [string, string],
  label: string,
  portrait: boolean,
): string {
  const [w, h] = portrait ? [1600, 2000] : [2400, 1600];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${colors[1]}"/><stop offset="1" stop-color="${colors[0]}"/></linearGradient></defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <g transform="translate(${w / 2 - 300} ${h / 2 - 330}) scale(25)" fill="none" stroke="rgba(10,14,24,0.55)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M16 7h.01"/><path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"/><path d="m20 7 2 .5-2 .5"/><path d="M10 18v3"/><path d="M14 17.75V21"/><path d="M7 18a6 6 0 0 0 3.84-10.61"/>
  </g>
  <text x="50%" y="${h - 220}" text-anchor="middle" font-family="Georgia, serif" font-size="150" fill="rgba(10,14,24,0.6)" letter-spacing="40">DEMO</text>
  <text x="50%" y="${h - 110}" text-anchor="middle" font-family="Georgia, serif" font-size="64" fill="rgba(10,14,24,0.6)">${label}</text>
</svg>`;
}

await rm(DATA, { recursive: true, force: true });
await rm(join(ROOT, 'public/demo-images'), { recursive: true, force: true });
await mkdir(join(DATA, 'species'), { recursive: true });
await mkdir(join(DATA, 'photos'), { recursive: true });

const sensitiveCodes = new Set(
  SPECIES.filter((s) => s.sensitive).map((s) => s.code),
);
const sightings = [];
for (const [i, d] of SIGHTINGS.entries()) {
  const id = `demo-${String(i + 1).padStart(2, '0')}-${d.code}`;
  const isSensitive =
    sensitiveCodes.has(d.code) || (d.photos ?? []).some((p) => p.isNest);
  sightings.push({
    id,
    origin: 'photo',
    speciesCode: d.code,
    eventDate: d.date,
    eventTime: d.time,
    countryCode: d.state.slice(0, 2),
    stateProvince: d.state,
    individualCount: 1,
    sensitive: isSensitive,
    location: publishLocation(
      { lat: d.lat, lon: d.lon, place: d.place },
      isSensitive,
    ),
  });

  for (const [j, p] of (d.photos ?? []).entries()) {
    const photoId = `${d.date}-${d.code}-${j + 1}`;
    const sp = SPECIES.find((s) => s.code === d.code);
    if (!sp) throw new Error(d.code);
    const name = taxonomy.byCode(d.code)?.commonName ?? d.code;
    const png = await sharp(
      Buffer.from(placeholderSvg(sp.colors, name, p.portrait ?? false)),
    )
      .png()
      .toBuffer();
    const out = await makeDerivatives(
      png,
      `demo-images/${photoId}`,
      join(ROOT, 'public'),
    );
    const [primary, secondary] = p.plumage;
    await writeFile(
      join(DATA, 'photos', `${photoId}.json`),
      `${JSON.stringify(
        {
          id: photoId,
          sightingId: id,
          takenAt: `${d.date}T${d.time}:00`,
          plumage: { primary, ...(secondary ? { secondary } : {}) },
          isNest: p.isNest ?? false,
          alt: p.alt,
          image: {
            key: `demo-images/${photoId}`,
            width: out.width,
            height: out.height,
            widths: out.widths,
            placeholder: out.placeholder,
          },
          camera: {
            body: 'Demo Camera',
            lens: '100-400mm',
            focalLengthMm: 400,
            aperture: 6.3,
            shutter: '1/1000',
            iso: 800,
          },
        },
        null,
        2,
      )}\n`,
    );
  }
}
await writeFile(
  join(DATA, 'sightings.json'),
  `${JSON.stringify(sightings, null, 2)}\n`,
);

for (const s of SPECIES) {
  const t = taxonomy.byCode(s.code);
  if (!t) throw new Error(`Unknown species code ${s.code}`);
  await writeFile(
    join(DATA, 'species', `${s.code}.json`),
    `${JSON.stringify(
      {
        ...t,
        ...(s.nickname ? { nickname: s.nickname } : {}),
        indigenousNames: s.indigenousNames ?? [],
        sensitive: s.sensitive ?? false,
        naturalHistory: s.naturalHistory,
        sources: [
          wiki(s.wiki),
          {
            title: 'eBird/Clements taxonomy',
            url: 'https://www.birds.cornell.edu/clementschecklist/',
          },
        ],
      },
      null,
      2,
    )}\n`,
  );
}

console.log(
  `Demo data: ${SPECIES.length} species, ${sightings.length} sightings.`,
);
