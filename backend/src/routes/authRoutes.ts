import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { JWT_EXPIRES_IN, JWT_SECRET, passwordSchema, usernameSchema } from '../services/authConfig.js';
import { deleteAccountKeepingAnonymousStats } from '../services/accountDeletionService.js';
import { prisma } from '../services/dbService.js';

const router = Router();

const registerSchema = z
  .object({
    username: usernameSchema,
    password: passwordSchema,
    name: z.string().trim().min(1, 'Enter your name.').max(60, 'Name must be at most 60 characters.')
  })
  .refine((d) => !d.password.toLowerCase().includes(d.username), {
    message: 'Password must not contain your username.',
    path: ['password']
  });

const loginSchema = z.object({
  username: z.string().trim().min(1).transform((u) => u.toLowerCase()),
  password: z.string().min(1)
});

const deleteAccountSchema = z.object({
  password: z.string().min(1)
});

// Compared against when the username doesn't exist, so a failed login takes the
// same time either way and response timing can't reveal which usernames exist.
const DUMMY_HASH = bcrypt.hashSync('synclife-timing-equaliser', 12);

// Brute-force protection: per-IP limits on the credential endpoints.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many sign-in attempts. Please wait a few minutes and try again.'
});
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many accounts created from this network. Please try again later.'
});
const usernameCheckLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Slow down a little and try again.'
});

function issueToken(user: { id: string; username: string }) {
  return jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  } as jwt.SignOptions);
}

// GET /api/auth/username-available?username=foo — live check while registering
router.get('/username-available', usernameCheckLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = usernameSchema.safeParse(req.query.username ?? '');
    if (!parsed.success) {
      res.json({ available: false, message: parsed.error.issues[0].message });
      return;
    }
    const existing = await prisma.user.findUnique({ where: { username: parsed.data }, select: { id: true } });
    res.json(existing ? { available: false, message: 'Username already taken.' } : { available: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/register
router.post('/register', registerLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password, name } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      res.status(409).json({ error: 'Conflict', message: 'Username already taken.' });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    // User + default profile together, so a failure can't leave a profile-less account.
    const user = await prisma.user.create({
      data: { username, password: hashed, name, profile: { create: {} } }
    });

    res.status(201).json({
      token: issueToken(user),
      user: { id: user.id, username: user.username, name: user.name }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { username } });
    const valid = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
    if (!user || !valid) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid username or password.' });
      return;
    }

    res.json({
      token: issueToken(user),
      user: { id: user.id, username: user.username, name: user.name }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me — validates the token and returns the signed-in user.
// The app calls this on launch so a revoked/expired session is caught immediately.
router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, username: true, name: true }
    });
    if (!user) {
      // Token is validly signed but the account is gone (e.g. deleted on another device).
      res.status(401).json({ error: 'Unauthorized', message: 'This account no longer exists.' });
      return;
    }
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/auth/account — permanently delete the signed-in user and all their
// personal data (every relation cascades), keeping only one row of anonymous,
// non-identifying usage aggregates. Required by Google Play's account-deletion policy.
// Re-checks the password so a stolen/leftover token alone can't wipe an account.
router.delete('/account', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { password } = deleteAccountSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      res.status(404).json({ error: 'NotFound', message: 'Account not found.' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      // 403, not 401 — the client treats 401 as an expired session and signs out.
      res.status(403).json({ error: 'Forbidden', message: 'Incorrect password.' });
      return;
    }

    await deleteAccountKeepingAnonymousStats(user.id);
    res.json({ deleted: true });
  } catch (error) {
    next(error);
  }
});

export default router;
