import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import { getMotivationAlarms, replaceMotivationAlarms } from '../services/dbService.js';

const router = Router();

const alarmsSchema = z.object({
  alarms: z.array(
    z.object({
      id: z.string().min(1),
      type: z.enum(['gym', 'work']),
      hour: z.number().int().min(0).max(23),
      minute: z.number().int().min(0).max(59),
      enabled: z.boolean()
    })
  )
});

// GET /api/alarms — the authenticated user's motivation alarms.
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await getMotivationAlarms(req.userId);
    const alarms = rows.map((a) => ({
      id: a.alarmId,
      type: a.type,
      hour: a.hour,
      minute: a.minute,
      enabled: a.enabled
    }));
    res.json({ alarms });
  } catch (error) {
    next(error);
  }
});

// PUT /api/alarms — replace the user's full alarm set.
router.put('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { alarms } = alarmsSchema.parse(req.body);
    const rows = await replaceMotivationAlarms(req.userId, alarms);
    res.json({
      alarms: rows.map((a) => ({
        id: a.alarmId,
        type: a.type,
        hour: a.hour,
        minute: a.minute,
        enabled: a.enabled
      }))
    });
  } catch (error) {
    next(error);
  }
});

export default router;
