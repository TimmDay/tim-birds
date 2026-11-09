# tim-birds

Tim Day's bird photography gallery and Life List, working name tim-bird. It is a public portfolio for biodiversity data roles, so the data model follows Darwin Core. Read [GLOSSARY.md](GLOSSARY.md) for the project's words (Sighting, Photo, Life List, Species Card, Published Location) and [docs/adr/](docs/adr/) for decisions.

## Rules that are easy to break

- **Exact Locations never enter the repo** (ADR 0003). Committed data holds only Published Locations. Exact coordinates, and the real Place of a Sensitive Sighting, live in the git-ignored `private/` folder.
- **Every Photo belongs to exactly one Sighting** (ADR 0001). A Photo with no eBird match gets a Photo Sighting; nothing is ever sent to eBird.
- **Photos are served from Cloudflare R2** as derivatives our CLI makes (ADR 0002). Originals are never committed. R2 credentials are for the CLI only; the site build must never need a secret.
- **Species names come from eBird/Clements.** Nickname and Indigenous Names are extra fields, never identifiers.
- **Species Cards echo the feel of a board game card, with our own icons and words.** Never copy Wingspan art, icons or card text.
- Use the glossary's words in code, UI copy and docs. Say "Plumage Color", not "dominant color".

## Conventions

- Tone: to the point and useful. No filler copy. Tim writes the real bio and About copy; use lorem ipsum for placeholders.
- Domain logic lives in plain TypeScript modules under `src/lib/` with Vitest tests beside them. Tests never touch the network.
- Hydrate interactive islands (Svelte) with `client:visible` or `client:idle`, never `client:only`.

## Commands

```sh
pnpm check      # lint + astro check
pnpm test:run   # unit tests (Vitest)
pnpm build      # static build into dist/ (real data/)
pnpm demo       # dev server on the demo dataset (DEMO=true)
```

Data CLIs (see [docs/adding-photos.md](docs/adding-photos.md)): `import-ebird`, `add-photo`, `best-photo`, `mark-sensitive`, `sync-photos`. They write `data/` (committed) and `private/` (never committed).

## Development

When starting the dev server, use background mode: `astro dev --background`. Manage it with `astro dev stop`, `astro dev status` and `astro dev logs`.
