import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { authMiddleware } from './middleware/authMiddleware.js';
import { errorHandler } from './middleware/errorHandler.js';
import logsRoutes from './routes/logsRoutes.js';
import sheetsRoutes from './routes/sheetsRoutes.js';
import goalsRoutes from './routes/goalsRoutes.js';
import queueRoutes from './routes/queueRoutes.js';
import motivationRoutes from './routes/motivationRoutes.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

// ─── Security & Parsing Middleware ────────────────────────────────────────────

app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [];

app.use(
  cors({
    // Allow all origins in dev (empty ALLOWED_ORIGINS), restrict in production
    origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '1mb' }));

// ─── Health Check (no auth required) ─────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Protected Routes ─────────────────────────────────────────────────────────

// All routes below this point require a valid Bearer token
app.use('/api', authMiddleware);

app.use('/api/sheets', sheetsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/motivation', motivationRoutes);

// ─── 404 Fallback ─────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: 'NotFound', message: 'Route not found.' });
});

// ─── Centralized Error Handler ────────────────────────────────────────────────

// Must be registered last — Express identifies error handlers by their 4 arguments
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[SyncLife API] Running on http://localhost:${PORT}`);
  console.log(`[SyncLife API] Health check: http://localhost:${PORT}/api/health`);
});

export default app;
