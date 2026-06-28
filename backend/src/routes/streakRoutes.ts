import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import { recordDailyLogin } from '../services/dbService.js';

const router = Router();

const loginSchema = z.object({
  // Device-local date so the streak respects the user's timezone, not the server's.
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
});

// POST /api/streak/login — record today's login and return the resulting streak.
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date } = loginSchema.parse(req.body ?? {});
    const today = date ?? new Date().toISOString().slice(0, 10);
    const result = await recordDailyLogin(req.userId, today);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
