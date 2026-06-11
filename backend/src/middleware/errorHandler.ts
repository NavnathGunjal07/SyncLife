import { Request, Response, NextFunction } from 'express';

/**
 * Centralized error handler. Must be registered last in Express middleware chain.
 * Logs full details server-side but only sends a safe message to the client.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // next is required as the 4th argument for Express to recognise this as an error handler
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
  const stack = err instanceof Error ? err.stack : undefined;

  console.error(`[${new Date().toISOString()}] ERROR ${req.method} ${req.path}`);
  console.error(stack ?? err);

  // 401 hint: propagate to client
  if (message.includes('authorization expired') || message.includes('401')) {
    res.status(401).json({ error: 'Unauthorized', message });
    return;
  }

  res.status(500).json({
    error: 'InternalServerError',
    message: 'Something went wrong on the server. Please try again.'
  });
}
