import 'dotenv/config';
import app from './app.js';

// Local development entry point. On Vercel the app is imported by api/index.ts
// as a serverless function, so this listener never runs there.
const PORT = process.env.PORT ?? 3001;

app.listen(PORT, () => {
  console.log(`[SyncLife API] Running on http://localhost:${PORT}`);
  console.log(`[SyncLife API] Health check: http://localhost:${PORT}/api/health`);
});

export default app;
