// The Darwin Core Archive descriptor (meta.xml) and dataset metadata (eml.xml).
// Column order comes from the same term lists the TSV writer uses.
import { MULTIMEDIA_TERMS, OCCURRENCE_TERMS } from './darwin-core.ts';

const DC_TERMS = new Set([
  'license',
  'rightsHolder',
  'references',
  'type',
  'format',
  'identifier',
  'title',
  'description',
  'created',
  'creator',
]);

export const termUri = (term: string) =>
  DC_TERMS.has(term)
    ? `http://purl.org/dc/terms/${term}`
    : `http://rs.tdwg.org/dwc/terms/${term}`;

const fileAttrs =
  'encoding="UTF-8" fieldsTerminatedBy="\\t" linesTerminatedBy="\\n" fieldsEnclosedBy="" ignoreHeaderLines="1"';

export function metaXml(): string {
  const occFields = OCCURRENCE_TERMS.map(
    (t, i) => `    <field index="${i}" term="${termUri(t)}" />`,
  ).join('\n');
  const mmFields = MULTIMEDIA_TERMS.slice(1)
    .map((t, i) => `    <field index="${i + 1}" term="${termUri(t)}" />`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<archive xmlns="http://rs.tdwg.org/dwc/text/" metadata="eml.xml">
  <core ${fileAttrs} rowType="http://rs.tdwg.org/dwc/terms/Occurrence">
    <files><location>occurrence.txt</location></files>
    <id index="0" />
${occFields}
  </core>
  <extension ${fileAttrs} rowType="http://rs.gbif.org/terms/1.0/Multimedia">
    <files><location>multimedia.txt</location></files>
    <coreid index="0" />
${mmFields}
  </extension>
</archive>
`;
}

const esc = (s: string) =>
  s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export function emlXml(o: {
  title: string;
  creator: string;
  abstract: string;
  pubDate: string;
  url: string;
}): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<eml:eml xmlns:eml="eml://ecoinformatics.org/eml-2.1.1" packageId="tim-bird-life-list" system="${esc(o.url)}" xml:lang="en">
  <dataset>
    <title>${esc(o.title)}</title>
    <creator><individualName><surName>${esc(o.creator)}</surName></individualName></creator>
    <pubDate>${o.pubDate}</pubDate>
    <language>en</language>
    <abstract><para>${esc(o.abstract)}</para></abstract>
    <intellectualRights><para>Records and images licensed CC BY-NC 4.0 (https://creativecommons.org/licenses/by-nc/4.0/).</para></intellectualRights>
    <distribution><online><url function="information">${esc(o.url)}</url></online></distribution>
  </dataset>
</eml:eml>
`;
}
