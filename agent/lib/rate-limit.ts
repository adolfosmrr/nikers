import { getCache } from "@vercel/functions";

const LIMIT = 10;
const WINDOW_SECONDS = 60 * 60;

interface Bucket {
  count: number;
  resetAt: number;
}

const cache = getCache({ namespace: "chat-rate-limit" });

function isBucket(value: unknown): value is Bucket {
  return typeof value === "object" && value !== null && "count" in value && "resetAt" in value;
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

async function isChatMessage(request: Request) {
  if (request.method !== "POST") return false;
  const path = new URL(request.url).pathname;
  if (!/^\/eve\/v1\/session(\/[^/]+)?\/?$/.test(path)) return false;
  try {
    const body: unknown = await request.clone().json();
    return typeof body === "object" && body !== null && "message" in body;
  } catch {
    return false;
  }
}

export async function isRateLimited(request: Request) {
  if (!(await isChatMessage(request))) return false;

  const key = getClientIp(request);
  const now = Date.now();
  const stored = await cache.get(key);
  const bucket: Bucket = isBucket(stored) && stored.resetAt > now ? stored : { count: 0, resetAt: now + WINDOW_SECONDS * 1000 };

  if (bucket.count >= LIMIT) return true;

  bucket.count += 1;
  const ttl = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  await cache.set(key, bucket, { ttl });
  return false;
}
