import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import { writeGoals } from '../services/sheetsService.js';

const router = Router();

// ─── Zod Schema ──────────────────────────────────────────────────────────────

const goalsSchema = z.object({
  spreadsheetId: z.string().min(1),
  profile: z.object({
    weightKg: z.number().positive(),
    heightCm: z.number().positive(),
    fitnessGoal: z.enum(['Lose weight', 'Maintain', 'Build muscle']),
    calorieTarget: z.number().positive(),
    waterGoalMl: z.number().positive(),
    waterGoalMode: z.enum(['auto', 'manual']),
    monthlyBudget: z.number().nonnegative()
  })
});

// ─── Routes ──────────────────────────────────────────────────────────────────

// POST /api/goals
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = goalsSchema.parse(req.body);
    await writeGoals(req.accessToken, parsed.spreadsheetId, parsed.profile);
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
