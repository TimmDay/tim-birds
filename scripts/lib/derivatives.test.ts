import { mkdtemp, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { beforeAll, describe, expect, it } from 'vitest';
import { makeDerivatives } from './derivatives.ts';

let dir: string;
let original: Buffer;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'tim-birds-deriv-'));
  // A 3000×2000 JPEG carrying GPS EXIF, like a phone or GPS-tagged camera shot.
  original = await sharp({
    create: { width: 3000, height: 2000, channels: 3, background: '#7a8b6c' },
  })
    .jpeg()
    .withExif({
      IFD0: { Make: 'TestCam' },
      IFD3: { GPSLatitudeRef: 'S', GPSLatitude: '28/1 14/1 4/1' },
    })
    .toBuffer();
  expect((await sharp(original).metadata()).exif).toBeDefined();
});

describe('makeDerivatives', () => {
  it('writes AVIF, WebP and JPEG at each width no larger than the original', async () => {
    const out = await makeDerivatives(original, 'photos/test-a', dir);
    expect(out.width).toBe(3000);
    expect(out.height).toBe(2000);
    expect(out.widths).toEqual([480, 960, 1600, 2400]);
    expect((await readdir(join(dir, 'photos'))).sort()).toHaveLength(12);
    expect(out.files.map((f) => f.key)).toContain('photos/test-a-1600.jpg');
  });

  it('strips all EXIF, so GPS never reaches R2', async () => {
    const out = await makeDerivatives(original, 'photos/test-b', dir);
    for (const f of out.files) {
      const meta = await sharp(await readFile(f.path)).metadata();
      expect(meta.exif, f.key).toBeUndefined();
    }
  });

  it('makes a tiny blurred placeholder data URI', async () => {
    const out = await makeDerivatives(original, 'photos/test-c', dir);
    expect(out.placeholder.startsWith('data:image/webp;base64,')).toBe(true);
    expect(out.placeholder.length).toBeLessThan(1200);
  });

  it('does not upscale a small original', async () => {
    const small = await sharp({
      create: { width: 800, height: 600, channels: 3, background: '#000' },
    })
      .jpeg()
      .toBuffer();
    const out = await makeDerivatives(small, 'photos/test-d', dir);
    expect(out.widths).toEqual([480, 800]);
  });
});
