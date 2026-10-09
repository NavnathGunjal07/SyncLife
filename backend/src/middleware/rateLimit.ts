import { Request, Response, NextFunction } from 'express';

/**
 * Minimal in-memory fixed-window rate limiter, keyed by client IP. Good enough
 * for a single pm2 process; swap for a shared store if the API is ever scaled out.
 */
export function rateLimit({ windowMs, max, message }: { windowMs: number; max: number; message: string }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    // app sets 'trust proxy' so req.ip is the client address nginx saw, not a spoofable header value.
    const ip = req.ip ?? 'unknown';

    let entry = hits.get(ip);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(ip, entry);
    }
    entry.count += 1;

    // Opportunistic cleanup so the map can't grow without bound.
    if (hits.size > 10_000) {
      for (const [key, value] of hits) if (value.resetAt <= now) hits.delete(key);
    }

    if (entry.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      res.status(429).json({ error: 'TooManyRequests', message });
      return;
    }
    next();
  };
}
