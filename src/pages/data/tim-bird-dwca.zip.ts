import type { APIRoute } from 'astro';
import { buildArchive } from '../../lib/archive.ts';

export const GET: APIRoute = async () =>
  new Response(new Blob([new Uint8Array(await buildArchive())]), {
    headers: { 'Content-Type': 'application/zip' },
  });
