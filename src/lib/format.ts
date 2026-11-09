const dateFmt = new Intl.DateTimeFormat('en-AU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** "2025-09-14" or "2025-09-14T06:52:10" → "14 September 2025". Dates are local to the Sighting, so no timezone shift. */
export const formatDate = (iso: string) =>
  dateFmt.format(new Date(`${iso.slice(0, 10)}T00:00:00Z`));
