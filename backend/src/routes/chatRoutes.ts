import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import { runChatTurn, getChatSession } from '../services/chatService.js';
import { getRecentChatMessages } from '../services/dbService.js';

const router = Router();

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional();

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  date: isoDate
});

function today(date?: string) {
  return date ?? new Date().toISOString().slice(0, 10);
}

// POST /api/chat — run one assistant turn (may execute tools / DB writes).
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, date } = chatSchema.parse(req.body);
    const result = await runChatTurn(req.userId, message, today(date));
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/chat/session — opening message (setup vs daily check-in).
router.get('/session', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const date = today(typeof req.query.date === 'string' ? req.query.date : undefined);
    const session = await getChatSession(req.userId, date);
    res.json(session);
  } catch (error) {
    next(error);
  }
});

// GET /api/chat/history — recent conversation (oldest-first).
router.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 40, 100);
    const rows = await getRecentChatMessages(req.userId, limit);
    const messages = rows.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      kind: m.kind,
      data: m.data ?? { cards: [], options: [] },
      createdAt: m.createdAt
    }));
    res.json({ messages });
  } catch (error) {
    next(error);
  }
});

export default router;
