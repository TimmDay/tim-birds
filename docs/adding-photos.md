# Adding Photos

The checklist for getting Photos onto the site. Words in **bold** are defined in [GLOSSARY.md](../GLOSSARY.md).

## One-time setup

- [ ] `pnpm install`
- [ ] R2 bucket and `.env` set up ([issue #5](https://github.com/TimmDay/tim-birds/issues/5)). Without it, `add-photo` still works and keeps images in `public/p/` until you run `pnpm sync-photos`.
- [ ] `private/` is backed up ([issue #8](https://github.com/TimmDay/tim-birds/issues/8)). It holds every **Exact Location** and is never committed.

## After birding

- [ ] Export from eBird ([issue #6](https://github.com/TimmDay/tim-birds/issues/6)) into `inbox/MyEBirdData.csv`.
- [ ] `pnpm import-ebird inbox/MyEBirdData.csv`
  - Safe to re-run: it updates **Sightings** rather than duplicating them.
  - Check the Life List count it prints against your eBird life list total.
  - If it offers to move Photos from a **Photo Sighting** to a new eBird checklist, say yes unless they are different outings.
  - **Read the list of Places it prints.** These are your eBird location names and will be public. Rename or hide personal ones ("Home", a street address) in `private/place-overrides.json`, then run the import again:
    ```json
    { "Home": null, "12 Smith St, Ashgrove": "Ashgrove" }
    ```
  - If it lists scientific names it doesn't know, the vendored taxonomy may be out of date. Ask Claude to refresh `scripts/data/ebird-taxonomy.csv`.

## For each batch of Photos

- [ ] Export your picks from Lightroom (or similar) as full-size JPEGs, **keeping EXIF** (capture time, camera, GPS). Put them anywhere, e.g. `inbox/`.
- [ ] `pnpm add-photo inbox/*.jpg`. For each Photo it asks:
  1. **Species**: type part of the name. Life List Species come first.
  2. **Sighting**: if eBird has that Species on that day, pick the checklist. Otherwise it makes a **Photo Sighting** (site only, never sent to eBird) and asks for country, state and **Place**, suggested from GPS.
  3. **Plumage Color**: the bird's colour, not the background. Primary, then optional secondary.
  4. **Nest?** Yes makes the Sighting a **Sensitive Sighting**: its location is withheld below state level.
  5. **Alt text**: what the Photo shows, for screen readers. Required.
  6. **Caption**: optional.
- [ ] `pnpm dev` and look at the Gallery and the new Photo pages.
- [ ] Optional: `pnpm best-photo <species code>` to pick a **Best Photo** (otherwise the most recent one is used).
- [ ] Commit `data/` and push. Never commit `private/`; `.gitignore` already blocks it.

## Sensitive Species

Owls at roosts, threatened species, anything a crowd of photographers could disturb:

- [ ] `pnpm mark-sensitive <species code>`. Every Sighting of it, past and future, publishes country and state only.

The build refuses to publish coordinates or a Place for a Sensitive Sighting, and refuses any coordinates not rounded to 0.1°, so a mistake fails CI instead of going live.

## If something goes wrong

- **Wrong Species or colour on a Photo:** edit `data/photos/<id>.json` by hand. The build checks it.
- **Re-adding the same file:** `add-photo` recognises it (by content hash) and skips it.
- **Images missing on the live site:** run `pnpm sync-photos` to upload anything R2 doesn't have.
