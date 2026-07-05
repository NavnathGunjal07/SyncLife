import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { authMiddleware } from './middleware/authMiddleware.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import authRoutes from './routes/authRoutes.js';
import logsRoutes from './routes/logsRoutes.js';
import goalsRoutes from './routes/goalsRoutes.js';
import motivationRoutes from './routes/motivationRoutes.js';
import streakRoutes from './routes/streakRoutes.js';
import alarmsRoutes from './routes/alarmsRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import memoryRoutes from './routes/memoryRoutes.js';
import habitsRoutes from './routes/habitsRoutes.js';

const app = express();

// ─── Security & Parsing Middleware ────────────────────────────────────────────

app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [];

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '1mb' }));

// ─── Request Logging ──────────────────────────────────────────────────────────

app.use(requestLogger);

// ─── Public Routes (no auth required) ────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);

// ─── Protected Routes ─────────────────────────────────────────────────────────

app.use('/api', authMiddleware);

app.use('/api/logs', logsRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/motivation', motivationRoutes);
app.use('/api/streak', streakRoutes);
app.use('/api/alarms', alarmsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/habits', habitsRoutes);

// ─── 404 Fallback ─────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: 'NotFound', message: 'Route not found.' });
});

// ─── Centralized Error Handler ────────────────────────────────────────────────

app.use(errorHandler);

export default app;
