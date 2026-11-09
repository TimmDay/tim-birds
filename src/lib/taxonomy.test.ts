import { describe, expect, it } from 'vitest';
import { createTaxonomy } from './taxonomy.ts';

const csv = `SCIENTIFIC_NAME,COMMON_NAME,SPECIES_CODE,CATEGORY,TAXON_ORDER,FAMILY_COM_NAME,FAMILY_SCI_NAME,REPORT_AS
Gallus gallus,Red Junglefowl,redjun,species,1642.0,"Pheasants, Grouse, and Allies",Phasianidae,
Gallus gallus (Domestic type),Red Junglefowl (Domestic type),redjun1,domestic,1648.0,"Pheasants, Grouse, and Allies",Phasianidae,redjun
Gymnorhina tibicen,Australian Magpie,ausmag2,species,12000.0,"Woodswallows, Bellmagpies, and Allies",Artamidae,
Gymnorhina tibicen [tibicen Group],Australian Magpie (Black-backed),ausmag3,issf,12001.0,"Woodswallows, Bellmagpies, and Allies",Artamidae,ausmag2
Anatidae sp.,duck sp.,duck,spuh,500.0,"Ducks, Geese, and Waterfowl",Anatidae,
Corvus coronoides/mellori,Australian/Little Raven,y00001,slash,13000.0,"Crows, Jays, and Magpies",Corvidae,
`;

describe('createTaxonomy', () => {
  const taxonomy = createTaxonomy(csv);

  it('resolves a species row to a Species', () => {
    expect(taxonomy.resolve('Gymnorhina tibicen')).toEqual({
      code: 'ausmag2',
      scientificName: 'Gymnorhina tibicen',
      commonName: 'Australian Magpie',
      family: 'Artamidae',
      familyCommonName: 'Woodswallows, Bellmagpies, and Allies',
      taxonOrder: 12000,
    });
  });

  it('rolls a subspecies group up to its Species via report-as', () => {
    expect(taxonomy.resolve('Gymnorhina tibicen [tibicen Group]')?.code).toBe(
      'ausmag2',
    );
  });

  it('does not count domestic types, spuhs or slashes as a Species', () => {
    expect(taxonomy.resolve('Gallus gallus (Domestic type)')).toBeUndefined();
    expect(taxonomy.resolve('Anatidae sp.')).toBeUndefined();
    expect(taxonomy.resolve('Corvus coronoides/mellori')).toBeUndefined();
  });

  it('looks a Species up by code', () => {
    expect(taxonomy.byCode('redjun')?.commonName).toBe('Red Junglefowl');
  });

  it('knows names it will not count, so only truly unknown names get reported', () => {
    expect(taxonomy.knows('Anatidae sp.')).toBe(true);
    expect(taxonomy.knows('Avis imaginaria')).toBe(false);
  });
});
