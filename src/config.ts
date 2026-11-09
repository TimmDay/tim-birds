// Build-time settings. Nothing here is secret: the site build needs no credentials.

/** Demo data (demo-data/) is only ever loaded with DEMO=true: dev and preview builds, never production. */
export const DEMO =
  import.meta.env.DEMO === 'true' || process.env.DEMO === 'true';

export const SITE_NAME = 'tim-bird';
export const SITE_URL = 'https://tim-bird.pages.dev';
export const PHOTOGRAPHER = 'Tim Day';

/** Where Photo derivatives are served from: R2 in production, the local demo folder in demo mode. */
export const IMAGE_BASE: string = DEMO
  ? ''
  : (import.meta.env.PUBLIC_IMAGE_BASE ?? process.env.PUBLIC_IMAGE_BASE ?? '');
