// In-memory rate limiter — per-instance (resets on cold start).
// Adequate for a low-traffic site; swap the Map for Upstash Redis if
// you need distributed rate limiting across multiple Vercel instances.

const stores = new Map(); // name -> Map<ip, { count, resetAt }>

function getStore(name) {
  if (!stores.has(name)) stores.set(name, new Map());
  return stores.get(name);
}

function pruneStore(store, now) {
  // ~5% chance per request to clean expired entries
  if (Math.random() < 0.05) {
    for (const [k, v] of store) {
      if (now > v.resetAt) store.delete(k);
    }
  }
}

export function getClientIp(req) {
  return (
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

/**
 * Check rate limit for an incoming request.
 * @param {object} req - Node/Vercel request
 * @param {{ name?: string, max?: number, windowMs?: number }} opts
 * @returns {{ limited: boolean, retryAfter?: number }}
 */
export function rateLimit(req, { name = 'default', max = 60, windowMs = 60_000 } = {}) {
  const ip = getClientIp(req);
  const now = Date.now();
  const store = getStore(name);

  pruneStore(store, now);

  let entry = store.get(ip);
  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return { limited: false };
  }

  entry.count += 1;
  if (entry.count > max) {
    return { limited: true, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  return { limited: false };
}

/**
 * Track a failed authentication attempt. Returns true if the IP has
 * exceeded the failure limit and should be locked out.
 * @param {object} req
 * @param {{ max?: number, windowMs?: number }} opts
 * @returns {boolean} true = locked out
 */
export function trackAuthFailure(req, { max = 5, windowMs = 15 * 60_000 } = {}) {
  const result = rateLimit(req, { name: 'auth-failures', max, windowMs });
  return result.limited;
}
