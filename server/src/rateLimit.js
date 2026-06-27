// Small in-memory fixed-window rate limiter. No external dependency.
// Suitable for a single-instance demo service; protects the token-spending
// endpoint from abuse. Returns Express middleware.

export function createRateLimiter({ windowMs = 60_000, max = 20, now = () => Date.now() } = {}) {
  // ip -> { count, resetAt }
  const buckets = new Map();

  return function rateLimit(req, res, next) {
    const key = req.ip || req.socket?.remoteAddress || 'unknown';
    const ts = now();
    let bucket = buckets.get(key);

    if (!bucket || ts >= bucket.resetAt) {
      bucket = { count: 0, resetAt: ts + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - ts) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res
        .status(429)
        .json({ error: 'Too many requests. Please slow down and try again shortly.' });
    }

    return next();
  };
}
