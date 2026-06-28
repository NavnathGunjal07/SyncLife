import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import { getSavedMemories, confirmMemory, deleteMemory } from '../services/dbService.js';

const router = Router();

// GET /api/memory — the user's saved long-term memories.
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await getSavedMemories(req.userId);
    const memories = rows.map((m) => ({ id: m.id, content: m.content, category: m.category, frequency: m.frequency }));
    res.json({ memories });
  } catch (error) {
    next(error);
  }
});

// POST /api/memory/confirm — promote a candidate memory to saved.
router.post('/confirm', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.body);
    const ok = await confirmMemory(req.userId, id);
    res.json({ success: ok });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/memory/:id — forget a memory.
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ok = await deleteMemory(req.userId, req.params.id);
    res.json({ success: ok });
  } catch (error) {
    next(error);
  }
});

export default router;
