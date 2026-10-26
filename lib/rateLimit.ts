// Minimal in-memory sliding-window rate limiter for the LLM-backed API
// routes. This app is stateless and has no database by design (see
// README), so a fixed-size in-process map is the right tool here — it
// resets on redeploy, which is acceptable for abuse-prevention rather than
// billing enforcement. Each serverless instance enforces its own limit,
// which is a known trade-off and is documented as such in the README.

interface Bucket {
  count: number;
  windowStartMs: number;
}

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 12;
const MAX_BUCKETS = 5000; // cap memory use

const buckets = new Map<string, Bucket>();

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now - existing.windowStartMs > WINDOW_MS) {
    if (buckets.size >= MAX_BUCKETS) {
      // Evict the oldest entry rather than let the map grow unbounded.
      const oldestKey = buckets.keys().next().value;
      if (oldestKey) buckets.delete(oldestKey);
    }
    buckets.set(key, { count: 1, windowStartMs: now });
    return false;
  }

  existing.count += 1;
  return existing.count > MAX_REQUESTS_PER_WINDOW;
}

export function clientKeyFrom(req: Request): string {
  // Behind Vercel/most proxies this header carries the real client IP.
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
