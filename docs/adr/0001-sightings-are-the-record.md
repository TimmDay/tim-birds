# Sightings are the record, Photos are evidence

The site is a portfolio for biodiversity-data work, so it models data the way Darwin Core does: the primary record is a Sighting (a DwC Occurrence of one Species at one place and time), and a Photo is media attached to exactly one Sighting. The Life List is derived from Sightings rather than kept by hand, which also covers species seen but never photographed. The obvious alternative, treating each Photo as the record with species and location on it, was rejected because it cannot represent unphotographed sightings and does not map cleanly to an Occurrence core with a multimedia extension.

Photos taken on outings never logged to eBird get a Photo Sighting: a site-only Sighting built from the Photo's EXIF and never sent to eBird. This keeps the rule "every Photo belongs to exactly one Sighting" without polluting Tim's eBird data.
