import { Request, Response, NextFunction } from 'express';

// Augment Express Request to carry the Google OAuth access token
declare global {
  namespace Express {
    interface Request {
      accessToken: string;
    }
  }
}

/**
 * Extracts the Bearer token from the Authorization header and attaches it
 * to req.accessToken. Returns 401 if the header is missing or malformed.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header. Expected: Bearer <google-access-token>'
    });
    return;
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Access token is empty.'
    });
    return;
  }

  req.accessToken = token;
  next();
}
