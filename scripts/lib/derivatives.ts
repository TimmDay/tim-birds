import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import sharp, { type Sharp } from 'sharp';

export const WIDTHS = [480, 960, 1600, 2400] as const;

const FORMATS = [
  {
    ext: 'avif',
    contentType: 'image/avif',
    encode: (s: Sharp) => s.avif({ quality: 55 }),
  },
  {
    ext: 'webp',
    contentType: 'image/webp',
    encode: (s: Sharp) => s.webp({ quality: 78 }),
  },
  {
    ext: 'jpg',
    contentType: 'image/jpeg',
    encode: (s: Sharp) => s.jpeg({ quality: 82, mozjpeg: true }),
  },
] as const;

export type DerivativeFile = { key: string; path: string; contentType: string };

export type Derivatives = {
  width: number;
  height: number;
  widths: number[];
  placeholder: string;
  files: DerivativeFile[];
};

/**
 * Resizes an original into the web derivatives the site serves, written under
 * `outDir/<key>-<width>.<ext>`. sharp drops all metadata unless asked to keep
 * it, so no EXIF (and no GPS) survives; a test pins that down.
 */
export async function makeDerivatives(
  original: Buffer,
  key: string,
  outDir: string,
): Promise<Derivatives> {
  // rotate() applies the EXIF orientation before the metadata is dropped.
  const base = sharp(original).rotate();
  const { width = 0, height = 0 } = await base
    .clone()
    .toBuffer({ resolveWithObject: true })
    .then((r) => r.info);

  const widths: number[] = WIDTHS.filter((w) => w < width);
  if (widths.length < WIDTHS.length) widths.push(width);

  await mkdir(dirname(join(outDir, key)), { recursive: true });
  const files: DerivativeFile[] = [];
  for (const w of widths) {
    for (const f of FORMATS) {
      const fileKey = `${key}-${w}.${f.ext}`;
      const path = join(outDir, fileKey);
      await writeFile(
        path,
        await f.encode(base.clone().resize({ width: w })).toBuffer(),
      );
      files.push({ key: fileKey, path, contentType: f.contentType });
    }
  }

  const tiny = await base
    .clone()
    .resize({ width: 24 })
    .blur(1.5)
    .webp({ quality: 40 })
    .toBuffer();
  return {
    width,
    height,
    widths,
    placeholder: `data:image/webp;base64,${tiny.toString('base64')}`,
    files,
  };
}
