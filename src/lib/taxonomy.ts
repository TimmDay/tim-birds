import { parse } from 'csv-parse/sync';
import type { Species, SpeciesCode } from './types.ts';

type TaxonRow = {
  SCIENTIFIC_NAME: string;
  COMMON_NAME: string;
  SPECIES_CODE: string;
  CATEGORY: string;
  TAXON_ORDER: string;
  FAMILY_COM_NAME: string;
  FAMILY_SCI_NAME: string;
  REPORT_AS: string;
};

// Taxa below species that count toward their parent Species. Domestic types,
// hybrids, spuhs and slashes never count, matching eBird's own life list.
const ROLLS_UP = new Set(['issf', 'form', 'intergrade']);

export type Taxonomy = {
  /** An eBird scientific name (any category) → the Species it counts as, if any. */
  resolve: (scientificName: string) => Species | undefined;
  byCode: (code: SpeciesCode) => Species | undefined;
  /** Every Species, in taxonomic order. */
  all: () => Species[];
};

/** Builds a lookup from the eBird/Clements taxonomy CSV (scripts/data/ebird-taxonomy.csv). */
export function createTaxonomy(csv: string): Taxonomy {
  const rows: TaxonRow[] = parse(csv, {
    columns: true,
    skip_empty_lines: true,
  });
  const species = new Map<SpeciesCode, Species>();
  const rowsByName = new Map<string, TaxonRow>();
  for (const r of rows) {
    rowsByName.set(r.SCIENTIFIC_NAME, r);
    if (r.CATEGORY !== 'species') continue;
    species.set(r.SPECIES_CODE, {
      code: r.SPECIES_CODE,
      scientificName: r.SCIENTIFIC_NAME,
      commonName: r.COMMON_NAME,
      family: r.FAMILY_SCI_NAME,
      familyCommonName: r.FAMILY_COM_NAME,
      taxonOrder: Number(r.TAXON_ORDER),
    });
  }
  return {
    resolve(name) {
      const row = rowsByName.get(name.trim());
      if (!row) return undefined;
      if (row.CATEGORY === 'species') return species.get(row.SPECIES_CODE);
      if (ROLLS_UP.has(row.CATEGORY)) return species.get(row.REPORT_AS);
      return undefined;
    },
    byCode: (code) => species.get(code),
    all: () => [...species.values()],
  };
}
