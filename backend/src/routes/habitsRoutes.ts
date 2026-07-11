import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  getHabitMonth,
  getHabitYear,
  createHabit,
  archiveHabit,
  setHabitLog,
  addTodayDefaults
} from '../services/habitService.js';

const router = Router();

const yearRe = /^\d{4}$/;
const monthRe = /^\d{4}-\d{2}$/;
const dateRe = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/habits?month=YYYY-MM — habits with each day's completion for the month.
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const month = String(req.query.month ?? new Date().toISOString().slice(0, 7));
    if (!monthRe.test(month)) {
      res.status(400).json({ error: 'BadRequest', message: 'month must be YYYY-MM.' });
      return;
    }
    const data = await getHabitMonth(req.userId, month);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/habits/year?year=YYYY — completed dates per habit for a whole year.
router.get('/year', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = String(req.query.year ?? new Date().toISOString().slice(0, 4));
    if (!yearRe.test(year)) {
      res.status(400).json({ error: 'BadRequest', message: 'year must be YYYY.' });
      return;
    }
    const data = await getHabitYear(req.userId, year);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// POST /api/habits — create a habit.
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = z
      .object({
        name: z.string().min(1).max(40),
        color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        icon: z.string().max(40).optional(),
        source: z.enum(['manual', 'water', 'meals', 'workout', 'sleep', 'walking']).optional()
      })
      .parse(req.body);
    const habit = await createHabit(req.userId, input);
    res.status(201).json({ habit });
  } catch (error) {
    next(error);
  }
});

// POST /api/habits/defaults — one-tap: seed today's default meals/water/walk.
router.post('/defaults', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date } = z.object({ date: z.string().regex(dateRe) }).parse(req.body);
    const result = await addTodayDefaults(req.userId, date);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/habits/:id/toggle — set a habit's status for a day (override).
router.post('/:id/toggle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, done } = z.object({ date: z.string().regex(dateRe), done: z.boolean() }).parse(req.body);
    const ok = await setHabitLog(req.userId, req.params.id, date, done);
    if (!ok) {
      res.status(404).json({ error: 'NotFound', message: 'Habit not found.' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/habits/:id — archive a habit.
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ok = await archiveHabit(req.userId, req.params.id);
    if (!ok) {
      res.status(404).json({ error: 'NotFound', message: 'Habit not found.' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
