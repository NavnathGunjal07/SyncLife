import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import { createSpreadsheet, fetchSheetRows } from '../services/sheetsService.js';

const router = Router();

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const fetchRowsParamSchema = z.object({
  sheet: z.string().min(1)
});

const fetchRowsQuerySchema = z.object({
  spreadsheetId: z.string().min(1)
});

// ─── Routes ──────────────────────────────────────────────────────────────────

// POST /api/sheets/create
// Creates a brand-new SyncLife spreadsheet for the authenticated user.
router.post('/create', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const spreadsheetId = await createSpreadsheet(req.accessToken);
    res.status(201).json({ spreadsheetId });
  } catch (error) {
    next(error);
  }
});

// GET /api/sheets/rows/:sheet?spreadsheetId=xxx
// Reads all rows from the named sheet tab.
router.get('/rows/:sheet', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sheet } = fetchRowsParamSchema.parse(req.params);
    const { spreadsheetId } = fetchRowsQuerySchema.parse(req.query);
    const rows = await fetchSheetRows(req.accessToken, spreadsheetId, sheet);
    res.json({ rows });
  } catch (error) {
    next(error);
  }
});

export default router;
