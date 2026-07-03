import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { upsertUserProfile, getUserProfile } from '../services/dbService.js';

const router = Router();

const goalsSchema = z.object({
  profile: z.object({
    weightKg: z.number().positive(),
    heightCm: z.number().positive(),
    fitnessGoal: z.enum(['Lose weight', 'Maintain', 'Build muscle']),
    calorieTarget: z.number().positive(),
    waterGoalMl: z.number().positive(),
    waterGoalMode: z.enum(['auto', 'manual']),
    monthlyBudget: z.number().nonnegative(),
    // Customization / preferences — optional for backward compatibility.
    dietaryPreference: z.enum(['veg', 'eggetarian', 'nonveg', 'vegan']).optional(),
    avoidFoods: z.string().max(200).optional(),
    workoutMode: z.enum(['Home', 'Gym']).optional(),
    workoutLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional()
  })
});

// GET /api/goals — fetch the authenticated user's profile
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await getUserProfile(req.userId);
    res.json({ profile });
  } catch (error) {
    next(error);
  }
});

// POST /api/goals — create or update the authenticated user's profile
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { profile } = goalsSchema.parse(req.body);
    const updated = await upsertUserProfile(req.userId, profile);
    res.status(201).json({ success: true, profile: updated });
  } catch (error) {
    next(error);
  }
});

export default router;
