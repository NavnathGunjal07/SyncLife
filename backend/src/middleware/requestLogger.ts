import { Request, Response, NextFunction } from 'express';

// ANSI colors for readable terminal output
const color = {
  reset: '\x1b[0m',
  gray: '\x1b[90m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function statusColor(status: number): string {
  if (status >= 500) return color.red;
  if (status >= 400) return color.yellow;
  if (status >= 300) return color.cyan;
  return color.green;
}

/**
 * Logs every API request once the response finishes, with method, URL,
 * status code, and how long it took to handle.
 *
 * Example: [2026-06-21T16:40:00.000Z] POST /api/auth/login 200 - 42ms
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const timestamp = new Date().toISOString();
    const sc = statusColor(res.statusCode);
    console.log(
      `${color.gray}[${timestamp}]${color.reset} ` +
        `${req.method} ${req.originalUrl} ` +
        `${sc}${res.statusCode}${color.reset} - ` +
        `${durationMs.toFixed(1)}ms`
    );
  });

  next();
}
