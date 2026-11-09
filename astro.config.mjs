// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
  // Working name; replace when a domain is chosen.
  site: 'https://tim-bird.pages.dev',
  trailingSlash: 'always',
  // Compression drops the space where a line break meets an inline tag ("the<a>").
  compressHTML: false,
  integrations: [svelte(), sitemap()],
});
