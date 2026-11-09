# Tim's Birds

A public portfolio of Tim's bird photography and life list, built to read as both a gallery and a credible biodiversity record (Darwin Core aligned).

## Language

### Taxonomy

**Species**:
A bird taxon at species rank as defined by the eBird/Clements checklist. The eBird/Clements scientific name and English name are authoritative; subspecies are not tracked separately.
_Avoid_: Bird (when the taxon is meant), taxon, kind

**Nickname**:
Free text Tim attaches to a Species, saying anything. Has no authority and is never used for identification.
_Avoid_: Alias, pet name

**Indigenous Name**:
A name for a Species in a named Indigenous language, always cited to a source. A Species may have many, one per language; unsourced names are never published.
_Avoid_: Aboriginal name, native name, local name

### Records

**Sighting**:
One observation by Tim of a Species at a place and time; a Darwin Core Occurrence. The Sighting is the record; Photos are evidence attached to it.
_Avoid_: Observation, record, occurrence (outside Darwin Core contexts), tick

**eBird Sighting**:
A Sighting imported from Tim's eBird data, identified by its eBird checklist and Species. eBird is the source of truth for it.

**Photo Sighting**:
A Sighting that exists only on this site, made when a Photo matches no eBird Sighting. Never sent to eBird.
_Avoid_: Casual sighting, manual sighting

**Life List**:
The set of every Species with at least one Sighting, whether or not it has a Photo. Derived from Sightings, never kept by hand.
_Avoid_: Checklist, species list

**Species Card**:
The presentation of one Life List Species: identity, natural history, and a link to its Best Photo if one exists.
_Avoid_: Card (unqualified), bird card, profile

**Natural History**:
The descriptive facts on a Species Card: range, habitat, diet, nesting, wingspan and similar. Drafted from open sources and reviewed by Tim.
_Avoid_: Bio, species info, facts

**Species Page**:
The page for one Species: its full Species Card plus every Photo of that Species.
_Avoid_: Species detail, bird page

**Habitat**:
Where a Species lives, from a closed list (forest, woodland, grassland, wetland, coastal, marine, arid, urban). A Species may have several, primary first.
_Avoid_: Environment, biome

**Diet**:
What a Species eats, from a closed list (insects, other invertebrates, fish, seeds, fruit, nectar, vertebrates, carrion, omnivore). A Species may have several, primary first.
_Avoid_: Food, feeding

**Nest Type**:
How a Species nests, from a closed list (cup, hollow, burrow, platform, ground scrape, mound, dome, none for brood parasites). Exactly one per Species.
_Avoid_: Nesting habit, nest

**Card Sources**:
The citations behind a Species Card's Natural History, always shown with the card.
_Avoid_: References, credits

**Photo**:
One published image Tim took, attached to exactly one Sighting and inheriting its Species, time and place. Carries its own licence.
_Avoid_: Image, picture, shot

**Best Photo**:
The Photo that represents a Species on its Species Card: Tim's pick when one is set, otherwise the most recent Photo of that Species.
_Avoid_: Hero image, featured photo, cover

**Plumage Color**:
The dominant color of the bird in a Photo, chosen from a fixed palette: one primary and an optional secondary. Describes the bird, never the background, and belongs to the Photo, not the Species.
_Avoid_: Dominant color, photo color

### Location

**Exact Location**:
The true coordinates of a Sighting. Private; never published.
_Avoid_: GPS, raw location

**Published Location**:
The generalised position of a Sighting that the public sees: coarsened by default; for a Sensitive Sighting, country and state only, with the Place withheld too.
_Avoid_: Public location, fuzzed location

**Sensitive Sighting**:
A Sighting of a Species flagged as sensitive, or of a nest, whose Published Location is withheld below state level.
_Avoid_: Hidden sighting, private sighting

**Place**:
An optional named spot where a Sighting happened (e.g. "Kakadu NP, Yellow Water"), within a country and state.
_Avoid_: Site, spot, hotspot

### Data sharing

**Darwin Core Archive**:
The downloadable bundle of all Sightings and their Photos expressed in Darwin Core, the site's machine-readable record of the Life List.
_Avoid_: Export, data dump, DwC-A (in prose)
