# Drafting Species Cards

Each Species on the Life List gets a stub file (`data/species/<code>.json`) when it is first imported. Its **Natural History** (the card's habitat, diet, nest, wingspan and so on) starts empty. The card shows the Species name and Photo until it is filled in.

Natural History is drafted by Claude from open sources and reviewed by Tim.

## Drafting

In a Claude Code session in this repo, ask:

> Draft Natural History for the Species in `data/species/` that have none. Use Wikipedia and Wikidata, cite them in `sources`, and set `reviewed: false`.

The draft must follow `speciesSchema` in `src/lib/schema.ts`:

| Field                              | Values                                                                                                                 |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `habitat`                          | one or more of forest, woodland, grassland, wetland, coastal, marine, arid, urban; primary first                       |
| `diet`                             | one or more of insects, other invertebrates, fish, seeds, fruit, nectar, vertebrates, carrion, omnivore; primary first |
| `nestType`                         | one of cup, hollow, burrow, platform, ground scrape, mound, dome, none (brood parasites)                               |
| `wingspanCm`, `lengthCm`, `clutch` | `[min, max]`; the same number twice when sources give one value                                                        |
| `iucn`                             | LC, NT, VU, EN, CR, EW, EX, DD, NE (from Wikidata P141 or the IUCN Red List)                                           |
| `migration`                        | resident, partial migrant, migrant, nomadic                                                                            |
| `range`                            | one sentence                                                                                                           |
| `flavour`                          | one short, true, surprising fact. Our own words; never copied from Wingspan cards                                      |
| `sources`                          | every page the draft used, as `{ title, url }`                                                                         |

Leave a field out rather than guess. The card simply omits it.

## Reviewing

- [ ] Read the card on `/species/<code>/` and check each fact against its source (the **i** button lists them).
- [ ] Fix anything wrong in the JSON, then set `"reviewed": true`. The "Draft card, not yet reviewed" note disappears.
- [ ] Add a `nickname` or `indigenousNames` entry if you like. Indigenous Names need a `language` and a `source`; unsourced names are never published.

## Sensitive Species

While drafting, flag Species that photographers could disturb (owls at roosts, threatened species, colonial nesters). Tim decides; `pnpm mark-sensitive <code>` applies it.
