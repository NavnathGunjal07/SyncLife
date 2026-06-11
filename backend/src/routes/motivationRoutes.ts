import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import { generateMotivation } from '../services/motivationService.js';

const router = Router();

// ─── Zod Schema ──────────────────────────────────────────────────────────────

const motivationSchema = z.object({
  type: z.enum(['gym', 'work']),
  name: z.string().max(100).optional(),
  streakDays: z.number().int().nonnegative().optional(),
  workoutDoneToday: z.boolean().optional(),
  timeOfDay: z.number().int().min(0).max(23).optional()
});

// ─── Routes ──────────────────────────────────────────────────────────────────

// POST /api/motivation — returns { message, source: 'ai' | 'bank' }
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = motivationSchema.parse(req.body);
    const result = await generateMotivation(parsed);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
