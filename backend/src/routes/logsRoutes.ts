import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import {
  appendMealLog,
  appendWorkoutLog,
  appendWaterLog,
  appendTransaction,
  appendGoldEntry,
  writeDailySummary
} from '../services/sheetsService.js';

const router = Router();

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const mealLogSchema = z.object({
  spreadsheetId: z.string().min(1),
  log: z.object({
    mealId: z.string().min(1),
    quantity: z.number().positive(),
    date: z.string().min(1),
    totalCalories: z.number().nonnegative(),
    totalProtein: z.number().nonnegative()
  })
});

const workoutLogSchema = z.object({
  spreadsheetId: z.string().min(1),
  log: z.object({
    date: z.string().min(1),
    day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
    exercises: z.array(z.string()),
    durationMin: z.number().nonnegative(),
    caloriesBurned: z.number().nonnegative(),
    completed: z.boolean()
  })
});

const waterLogSchema = z.object({
  spreadsheetId: z.string().min(1),
  log: z.object({
    date: z.string().min(1),
    time: z.string().min(1),
    amountMl: z.number().positive(),
    dailyTotalMl: z.number().nonnegative().optional(),
    goalMl: z.number().nonnegative().optional()
  })
});

const transactionSchema = z.object({
  spreadsheetId: z.string().min(1),
  tx: z.object({
    id: z.string().min(1),
    type: z.enum(['expense', 'income']),
    category: z.string().min(1),
    amount: z.number().positive(),
    notes: z.string(),
    date: z.string().min(1)
  })
});

const goldEntrySchema = z.object({
  spreadsheetId: z.string().min(1),
  entry: z.object({
    id: z.string().min(1),
    category: z.enum(['Jewellery', 'Coins', 'Digital Gold', 'SIP']),
    grams: z.number().positive(),
    buyPrice: z.number().positive(),
    date: z.string().min(1)
  })
});

const summarySchema = z.object({
  spreadsheetId: z.string().min(1),
  summary: z.object({
    date: z.string().min(1),
    caloriesConsumed: z.number().nonnegative(),
    caloriesBurned: z.number().nonnegative(),
    netCalories: z.number(),
    waterMl: z.number().nonnegative(),
    waterGoalMl: z.number().nonnegative(),
    spend: z.number().nonnegative(),
    workoutCompleted: z.boolean(),
    streak: z.number().nonnegative(),
    completionPercent: z.number().min(0).max(100)
  })
});

// ─── Routes ──────────────────────────────────────────────────────────────────

// POST /api/logs/meal
router.post('/meal', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = mealLogSchema.parse(req.body);
    await appendMealLog(req.accessToken, parsed.spreadsheetId, parsed.log);
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/logs/workout
router.post('/workout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = workoutLogSchema.parse(req.body);
    await appendWorkoutLog(req.accessToken, parsed.spreadsheetId, parsed.log);
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/logs/water
router.post('/water', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = waterLogSchema.parse(req.body);
    await appendWaterLog(req.accessToken, parsed.spreadsheetId, parsed.log);
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/logs/transaction
router.post('/transaction', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = transactionSchema.parse(req.body);
    await appendTransaction(req.accessToken, parsed.spreadsheetId, parsed.tx);
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/logs/gold
router.post('/gold', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = goldEntrySchema.parse(req.body);
    await appendGoldEntry(req.accessToken, parsed.spreadsheetId, parsed.entry);
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/logs/summary
router.post('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = summarySchema.parse(req.body);
    await writeDailySummary(req.accessToken, parsed.spreadsheetId, parsed.summary);
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
