import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import { generateMotivation, continueMotivation } from '../services/motivationService.js';

const router = Router();

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const motivationType = z.enum(['gym', 'work', 'reminder', 'sleep']);

const baseContext = {
  type: motivationType,
  name: z.string().max(100).optional(),
  streakDays: z.number().int().nonnegative().optional(),
  workoutDoneToday: z.boolean().optional(),
  timeOfDay: z.number().int().min(0).max(23).optional(),
  language: z.enum(['en', 'hi', 'mr']).optional()
};

const motivationSchema = z.object(baseContext);

const replySchema = z.object({
  ...baseContext,
  history: z
    .array(
      z.object({
        role: z.enum(['assistant', 'user']),
        content: z.string().min(1).max(2000)
      })
    )
    .min(1)
    .max(40)
});

// ─── Routes ──────────────────────────────────────────────────────────────────

// POST /api/motivation — opening call line → { message, source: 'ai' | 'bank' }
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = motivationSchema.parse(req.body);
    const result = await generateMotivation(parsed);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/motivation/reply — coach's reply in a two-way call → { message, source }
router.post('/reply', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = replySchema.parse(req.body);
    const result = await continueMotivation(parsed);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
