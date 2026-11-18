import { timingSafeEqual } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

/** Fixed window per IP limiter. In memory: MVP only, resets on restart and is per process. */
export function rateLimit(options: { windowMs: number; max: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = req.ip ?? 'unknown';
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + options.windowMs });
      if (hits.size > 10_000) for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
      return next();
    }
    if (++entry.count > options.max) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({ success: false, error: 'Too many requests' });
    }
    next();
  };
}

/** Requires the `x-admin-token` header to equal the configured token. Disabled entirely when no token is set. */
export function requireAdminToken(getToken: () => string | undefined) {
  return (req: Request, res: Response, next: NextFunction) => {
    const expected = getToken();
    if (!expected) return res.status(403).json({ success: false, error: 'Admin actions are disabled (ROSTER_ADMIN_TOKEN not set)' });
    const provided = Buffer.from(String(req.headers['x-admin-token'] ?? ''));
    const wanted = Buffer.from(expected);
    if (provided.length !== wanted.length || !timingSafeEqual(provided, wanted)) {
      return res.status(401).json({ success: false, error: 'Invalid admin token' });
    }
    next();
  };
}
