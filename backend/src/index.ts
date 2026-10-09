import 'dotenv/config';
import app from './app.js';

// Local development entry point. On Vercel the app is imported by api/index.ts
// as a serverless function, so this listener never runs there.
const PORT = Number(process.env.PORT ?? 3001);
// On the VM this is 127.0.0.1 so the API is only reachable through nginx.
const HOST = process.env.HOST ?? '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`[SyncLife API] Running on http://${HOST}:${PORT}`);
  console.log(`[SyncLife API] Health check: http://localhost:${PORT}/api/health`);
});

export default app;
