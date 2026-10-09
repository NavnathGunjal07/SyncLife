import { z } from 'zod';

const DEV_SECRET = 'synclife-dev-secret-change-in-production';

// A known fallback secret would let anyone forge tokens, so production refuses to run without one.
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production.');
}

export const JWT_SECRET = process.env.JWT_SECRET ?? DEV_SECRET;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '30d';

// Keep in sync with frontend/src/utils/password.ts
export const PASSWORD_MIN = 8;
// bcrypt silently ignores everything after 72 bytes.
export const PASSWORD_MAX = 72;

const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', '1234567890', 'qwerty123',
  'qwertyuiop', 'iloveyou', 'abc12345', 'admin123', 'welcome1', 'letmein1', 'football1',
  'baseball1', 'sunshine1', 'princess1', 'passw0rd', 'p@ssw0rd', 'synclife', 'synclife1',
  'synclife123', '11111111', '00000000', 'asdf1234', 'zxcvbnm1', 'india123', 'monkey123'
]);

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters.')
  .max(30, 'Username must be at most 30 characters.')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores.')
  .transform((u) => u.toLowerCase());

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters.`)
  .refine((p) => Buffer.byteLength(p, 'utf8') <= PASSWORD_MAX, `Password must be at most ${PASSWORD_MAX} characters.`)
  .refine((p) => /[a-zA-Z]/.test(p) && /\d/.test(p), 'Password must contain at least one letter and one number.')
  .refine((p) => !COMMON_PASSWORDS.has(p.toLowerCase()), 'That password is too common. Pick something harder to guess.');
