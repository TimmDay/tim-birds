import { describe, expect, it } from 'vitest';
import { parseEbirdExport } from './ebird.ts';
import { createTaxonomy } from './taxonomy.ts';

const HEADER =
  'Submission ID,Common Name,Scientific Name,Taxonomic Order,Count,State/Province,County,Location ID,Location,Latitude,Longitude,Date,Time,Protocol,Duration (Min),All Obs Reported,Distance Traveled (km),Area Covered (ha),Number of Observers,Breeding Code,Observation Details,Checklist Comments,ML Catalog Numbers';

const csv = [
  HEADER,
  'S100,Laughing Kookaburra,Dacelo novaeguineae,9001,2,AU-QLD,Scenic Rim,L1,"O\'Reilly\'s, Lamington NP",-28.23456,153.13789,2025-09-14,06:45 AM,eBird - Traveling Count,90,1,2.1,,1,,,,',
  'S100,duck sp.,Anatidae sp.,500,1,AU-QLD,Scenic Rim,L1,"O\'Reilly\'s, Lamington NP",-28.23456,153.13789,2025-09-14,06:45 AM,eBird - Traveling Count,90,1,2.1,,1,,,,',
  'S101,Australian Magpie,Gymnorhina tibicen,12000,X,AU-NSW,Sydney,L2,Centennial Park,-33.8981,151.2337,2024-01-02,05:10 PM,eBird - Stationary Count,30,1,,,1,,,,',
  'S102,Australian Magpie (White-backed),Gymnorhina tibicen [tibicen Group],12001,1,AU-VIC,Melbourne,L3,Royal Park,-37.78,144.95,2024-02-03,,Incidental,,0,,,1,,,,',
];

const { resolve } =
  createTaxonomy(`SCIENTIFIC_NAME,COMMON_NAME,SPECIES_CODE,CATEGORY,TAXON_ORDER,FAMILY_COM_NAME,FAMILY_SCI_NAME,REPORT_AS
Dacelo novaeguineae,Laughing Kookaburra,laukoo1,species,9001.0,Kingfishers,Alcedinidae,
Gymnorhina tibicen,Australian Magpie,ausmag2,species,12000.0,"Woodswallows, Bellmagpies, and Allies",Artamidae,
Gymnorhina tibicen [tibicen Group],Australian Magpie (White-backed),ausmag3,issf,12001.0,"Woodswallows, Bellmagpies, and Allies",Artamidae,ausmag2
Anatidae sp.,duck sp.,duck,spuh,500.0,"Ducks, Geese, and Waterfowl",Anatidae,
`);

describe('parseEbirdExport', () => {
  const rows = parseEbirdExport(csv.join('\n'), resolve);

  it('turns a species row into an imported eBird Sighting with its Exact Location', () => {
    expect(rows[0]).toEqual({
      id: 'ebird-S100-laukoo1',
      speciesCode: 'laukoo1',
      ebirdChecklistId: 'S100',
      eventDate: '2025-09-14',
      eventTime: '06:45',
      countryCode: 'AU',
      stateProvince: 'AU-QLD',
      individualCount: 2,
      exact: {
        lat: -28.23456,
        lon: 153.13789,
        place: "O'Reilly's, Lamington NP",
      },
    });
  });

  it('drops rows that are not a Species', () => {
    expect(rows.map((r) => r.id)).not.toContain('ebird-S100-undefined');
    expect(rows).toHaveLength(3);
  });

  it('reads "X" as present with no count, and PM times as 24 hour', () => {
    expect(rows[1]).toMatchObject({ eventTime: '17:10' });
    expect(rows[1]?.individualCount).toBeUndefined();
  });

  it('rolls subspecies groups up to their Species', () => {
    expect(rows[2]).toMatchObject({
      id: 'ebird-S102-ausmag2',
      speciesCode: 'ausmag2',
    });
    expect(rows[2]?.eventTime).toBeUndefined();
  });
});
