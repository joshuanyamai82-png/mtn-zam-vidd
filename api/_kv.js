import { Redis } from '@upstash/redis';

/* Works with Vercel KV (auto-injected vars) OR Upstash directly */

const url =
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL;

const token =
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  throw new Error(
    'Missing Redis credentials. Connect Vercel KV or Upstash Redis to this project.'
  );
}

export const kv = new Redis({ url, token });

export const GATE_TTL = 3600; // seconds