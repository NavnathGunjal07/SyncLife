import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import { enqueue, queueSize, flushQueue } from '../services/queueService.js';

const router = Router();

// ─── Zod Schema ──────────────────────────────────────────────────────────────

const flushSchema = z.object({
  spreadsheetId: z.string().min(1)
});

const sizeQuerySchema = z.object({
  spreadsheetId: z.string().optional() // optional, we only need the token for lookup
});

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /api/queue/size
// Returns the number of pending writes queued for this user's token.
router.get('/size', (req: Request, res: Response) => {
  sizeQuerySchema.parse(req.query);
  const size = queueSize(req.accessToken);
  res.json({ size });
});

// POST /api/queue/flush
// Attempts to flush all pending writes to Google Sheets.
router.post('/flush', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { spreadsheetId } = flushSchema.parse(req.body);
    const flushed = await flushQueue(req.accessToken, spreadsheetId);
    res.json({ flushed, remaining: queueSize(req.accessToken) });
  } catch (error) {
    next(error);
  }
});

export { enqueue };
export default router;
