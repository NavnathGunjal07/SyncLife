import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  createMealLog,
  createWorkoutLog,
  createWaterLog,
  createTransaction,
  createGoldEntry,
  upsertDailySummary,
  getMealLogsForDate,
  getWorkoutLogsForDate,
  getWorkoutHistory,
  getWaterLogsForDate,
  getTransactionsForMonth,
  getAllGoldEntries,
  getDailySummary
} from '../services/dbService.js';

const router = Router();

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const mealLogSchema = z.object({
  log: z.object({
    mealId: z.string().min(1),
    mealName: z.string().optional(),
    mealType: z.string().optional(),
    quantity: z.number().positive(),
    date: z.string().min(1),
    totalCalories: z.number().nonnegative(),
    totalProtein: z.number().nonnegative()
  })
});

const workoutLogSchema = z.object({
  log: z.object({
    date: z.string().min(1),
    day: z.string().min(1),
    exercises: z.array(z.string()),
    durationMin: z.number().nonnegative(),
    caloriesBurned: z.number().nonnegative(),
    completed: z.boolean()
  })
});

const waterLogSchema = z.object({
  log: z.object({
    date: z.string().min(1),
    time: z.string().min(1),
    amountMl: z.number().positive(),
    dailyTotalMl: z.number().nonnegative().optional(),
    goalMl: z.number().nonnegative().optional()
  })
});

const transactionSchema = z.object({
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
  entry: z.object({
    id: z.string().min(1),
    category: z.enum(['Jewellery', 'Coins', 'Digital Gold', 'SIP']),
    grams: z.number().positive(),
    buyPrice: z.number().positive(),
    date: z.string().min(1)
  })
});

const summarySchema = z.object({
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

// ─── Meal Routes ──────────────────────────────────────────────────────────────

router.post('/meal', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { log } = mealLogSchema.parse(req.body);
    await createMealLog(req.userId, log);
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/meals', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const date = String(req.query.date ?? new Date().toISOString().slice(0, 10));
    const logs = await getMealLogsForDate(req.userId, date);
    res.json({ logs });
  } catch (error) {
    next(error);
  }
});

// ─── Workout Routes ───────────────────────────────────────────────────────────

router.post('/workout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { log } = workoutLogSchema.parse(req.body);
    await createWorkoutLog(req.userId, log);
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/workouts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const date = String(req.query.date ?? new Date().toISOString().slice(0, 10));
    const raw = await getWorkoutLogsForDate(req.userId, date);
    const logs = raw.map((l) => ({ ...l, exercises: JSON.parse(l.exercises) as string[] }));
    res.json({ logs });
  } catch (error) {
    next(error);
  }
});

// Recent workout history (most recent first) for the History tab.
router.get('/workouts/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 60, 200);
    const raw = await getWorkoutHistory(req.userId, limit);
    const logs = raw.map((l) => ({ ...l, exercises: JSON.parse(l.exercises) as string[] }));
    res.json({ logs });
  } catch (error) {
    next(error);
  }
});

// ─── Water Routes ─────────────────────────────────────────────────────────────

router.post('/water', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { log } = waterLogSchema.parse(req.body);
    await createWaterLog(req.userId, log);
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/water', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const date = String(req.query.date ?? new Date().toISOString().slice(0, 10));
    const logs = await getWaterLogsForDate(req.userId, date);
    res.json({ logs });
  } catch (error) {
    next(error);
  }
});

// ─── Transaction Routes ───────────────────────────────────────────────────────

router.post('/transaction', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tx } = transactionSchema.parse(req.body);
    await createTransaction(req.userId, tx);
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/transactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = String(req.query.year ?? new Date().getFullYear());
    const month = String(req.query.month ?? String(new Date().getMonth() + 1).padStart(2, '0'));
    const transactions = await getTransactionsForMonth(req.userId, year, month);
    res.json({ transactions });
  } catch (error) {
    next(error);
  }
});

// ─── Gold Routes ──────────────────────────────────────────────────────────────

router.post('/gold', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { entry } = goldEntrySchema.parse(req.body);
    await createGoldEntry(req.userId, entry);
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/gold', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entries = await getAllGoldEntries(req.userId);
    res.json({ entries });
  } catch (error) {
    next(error);
  }
});

// ─── Summary Routes ───────────────────────────────────────────────────────────

router.post('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { summary } = summarySchema.parse(req.body);
    await upsertDailySummary(req.userId, summary);
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const date = String(req.query.date ?? new Date().toISOString().slice(0, 10));
    const summary = await getDailySummary(req.userId, date);
    res.json({ summary });
  } catch (error) {
    next(error);
  }
});

export default router;
