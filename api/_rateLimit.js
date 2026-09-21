/*
 * Simple per-visitor request limiter.
 * The counts live in this server instance's memory, so it stops
 * casual abuse and accidental loops, not a determined attacker.
 */
const buckets = new Map();
const MAX_KEYS = 5000;

function getClientId(req) {
  const forwarded = req.headers["x-forwarded-for"];

  const first =
    typeof forwarded === "string"
      ? forwarded.split(",")[0].trim()
      : "";

  return (
    first ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

export function checkRateLimit(req, { name, limit, windowMs }) {
  const now = Date.now();
  const key = `${name}:${getClientId(req)}`;

  const recent = (buckets.get(key) || []).filter(
    (time) => now - time < windowMs
  );

  if (recent.length >= limit) {
    buckets.set(key, recent);

    return {
      allowed: false,
      retryAfter: Math.max(
        1,
        Math.ceil((recent[0] + windowMs - now) / 1000)
      ),
    };
  }

  recent.push(now);
  buckets.set(key, recent);

  // Keep memory bounded.
  if (buckets.size > MAX_KEYS) {
    for (const [otherKey, times] of buckets) {
      if (!times.some((time) => now - time < windowMs)) {
        buckets.delete(otherKey);
      }
    }

    while (buckets.size > MAX_KEYS) {
      buckets.delete(buckets.keys().next().value);
    }
  }

  return { allowed: true };
}