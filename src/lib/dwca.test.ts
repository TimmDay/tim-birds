import { describe, expect, it } from 'vitest';
import { MULTIMEDIA_TERMS, OCCURRENCE_TERMS } from './darwin-core.ts';
import { metaXml, termUri } from './dwca.ts';

describe('termUri', () => {
  it('uses the Dublin Core namespace for dc terms and Darwin Core for the rest', () => {
    expect(termUri('scientificName')).toBe(
      'http://rs.tdwg.org/dwc/terms/scientificName',
    );
    expect(termUri('license')).toBe('http://purl.org/dc/terms/license');
    expect(termUri('references')).toBe('http://purl.org/dc/terms/references');
    expect(termUri('identifier')).toBe('http://purl.org/dc/terms/identifier');
  });
});

describe('metaXml', () => {
  const xml = metaXml();

  it('declares an Occurrence core and a Simple Multimedia extension', () => {
    expect(xml).toContain('rowType="http://rs.tdwg.org/dwc/terms/Occurrence"');
    expect(xml).toContain('rowType="http://rs.gbif.org/terms/1.0/Multimedia"');
    expect(xml).toContain('<location>occurrence.txt</location>');
    expect(xml).toContain('<location>multimedia.txt</location>');
  });

  it('maps every column index to its term, in the order the TSV is written', () => {
    expect(xml).toContain('<id index="0" />');
    OCCURRENCE_TERMS.forEach((t, i) => {
      expect(xml).toContain(`<field index="${i}" term="${termUri(t)}" />`);
    });
    expect(xml).toContain('<coreid index="0" />');
    MULTIMEDIA_TERMS.slice(1).forEach((t, i) => {
      expect(xml).toContain(`<field index="${i + 1}" term="${termUri(t)}" />`);
    });
  });
});
