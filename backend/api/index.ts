// Vercel serverless entry point.
// The build step (`prisma generate && tsc`) compiles src/ to dist/, so we import
// the already-compiled Express app here — this keeps Vercel's bundler away from
// the .js-extension TypeScript imports used throughout src/.
import app from '../dist/app.js';

export default app;
