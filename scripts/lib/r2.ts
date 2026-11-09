// Uploads Photo derivatives to Cloudflare R2 (ADR 0002). Credentials come from
// .env and are used by the CLI only; the site build never sees them.
import { readFile } from 'node:fs/promises';
import {
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import 'dotenv/config';

export type Upload = { key: string; path: string; contentType: string };

const env = (name: string) => process.env[name]?.trim() ?? '';

export function r2Configured(): boolean {
  return [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET',
  ].every((n) => env(n) !== '');
}

function client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${env('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env('R2_ACCESS_KEY_ID'),
      secretAccessKey: env('R2_SECRET_ACCESS_KEY'),
    },
  });
}

/** Every key already in the bucket under `prefix`. */
export async function listKeys(prefix: string): Promise<Set<string>> {
  const s3 = client();
  const keys = new Set<string>();
  let token: string | undefined;
  do {
    const page = await s3.send(
      new ListObjectsV2Command({
        Bucket: env('R2_BUCKET'),
        Prefix: prefix,
        ContinuationToken: token,
      }),
    );
    for (const o of page.Contents ?? []) if (o.Key) keys.add(o.Key);
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

/** Derivative names never change, so they can be cached for a year. */
export async function upload(files: Upload[]): Promise<void> {
  const s3 = client();
  for (const f of files) {
    await s3.send(
      new PutObjectCommand({
        Bucket: env('R2_BUCKET'),
        Key: f.key,
        Body: await readFile(f.path),
        ContentType: f.contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
  }
}

export async function exists(key: string): Promise<boolean> {
  try {
    await client().send(
      new HeadObjectCommand({ Bucket: env('R2_BUCKET'), Key: key }),
    );
    return true;
  } catch {
    return false;
  }
}
