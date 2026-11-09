export type ImageInfo = {
  key: string;
  width: number;
  height: number;
  widths: number[];
  placeholder: string;
};

export const IMAGE_FORMATS = [
  { ext: 'avif', type: 'image/avif' },
  { ext: 'webp', type: 'image/webp' },
] as const;

export const imageUrl = (
  base: string,
  image: ImageInfo,
  width: number,
  ext = 'jpg',
) => `${base}/${image.key}-${width}.${ext}`;

export const srcset = (base: string, image: ImageInfo, ext: string) =>
  image.widths.map((w) => `${imageUrl(base, image, w, ext)} ${w}w`).join(', ');

/** The widest derivative no wider than `max`, for a single-URL use (Darwin Core, og:image). */
export function widthAtMost(image: ImageInfo, max: number): number {
  const fits = image.widths.filter((w) => w <= max);
  return fits.length ? Math.max(...fits) : Math.min(...image.widths);
}
