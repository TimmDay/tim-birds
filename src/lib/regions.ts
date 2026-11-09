const countries = new Intl.DisplayNames(['en'], { type: 'region' });

/** "AU" → "Australia". */
export function countryName(code: string): string {
  return countries.of(code) ?? code;
}

// ISO 3166-2 names. Add a country's subdivisions when Tim first birds there;
// unknown codes fall back to the code itself.
const STATES: Record<string, string> = {
  'AU-ACT': 'Australian Capital Territory',
  'AU-NSW': 'New South Wales',
  'AU-NT': 'Northern Territory',
  'AU-QLD': 'Queensland',
  'AU-SA': 'South Australia',
  'AU-TAS': 'Tasmania',
  'AU-VIC': 'Victoria',
  'AU-WA': 'Western Australia',
};

/** "AU-QLD" → "Queensland". */
export function stateName(code: string): string {
  return STATES[code] ?? code;
}
