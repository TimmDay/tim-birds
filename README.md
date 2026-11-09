# tim-birds

Bird photography and life list by Tim Day, published as a static site and as a [Darwin Core](https://dwc.tdwg.org/) Archive.

- **Gallery** of Photos, filterable by species, country, state, year and Plumage Color
- **Species Cards** for every species on the Life List: habitat, diet, nest, wingspan, sources
- **Map** of Sightings at 0.1° resolution, with Sensitive Sightings withheld
- **Data**: a Darwin Core Archive (Occurrence core + Simple Multimedia) rebuilt on every deploy

## How it works

```text
eBird export ──import-ebird──┐
                             ├─► data/ (committed, Published Locations only) ──astro build──► static site + DwC-A
photos ──────add-photo───────┘        private/ (git-ignored: Exact Locations)
                 └─► AVIF/WebP/JPEG derivatives ──► Cloudflare R2
```

The record is the **Sighting** (a Darwin Core Occurrence); Photos are media attached to it. Exact coordinates never enter this repo: the schema rejects any committed coordinate that is not rounded to 0.1°, and any location on a Sensitive Sighting.

Read [GLOSSARY.md](GLOSSARY.md) for the vocabulary, [docs/adr/](docs/adr/) for the decisions, and [docs/adding-photos.md](docs/adding-photos.md) for the workflow.

## Develop

```sh
pnpm install
pnpm demo        # dev server on the demo dataset (placeholder images, sample records)
pnpm dev         # dev server on real data/
pnpm check       # lint + typecheck
pnpm test:run    # unit tests
pnpm build       # static build into dist/
```

Astro, Svelte, TypeScript, sharp, MapLibre. Hosted on Cloudflare Pages, images on Cloudflare R2. Taxonomy: eBird/Clements.

## Licence

Photos and records: [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). Code: all rights reserved unless a licence file says otherwise.
