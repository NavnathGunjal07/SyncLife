// Mirrors backend/src/services/authConfig.ts — the server is the source of truth,
// these checks only give instant feedback while typing.
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', '1234567890', 'qwerty123',
  'qwertyuiop', 'iloveyou', 'abc12345', 'admin123', 'welcome1', 'letmein1', 'football1',
  'baseball1', 'sunshine1', 'princess1', 'passw0rd', 'p@ssw0rd', 'synclife', 'synclife1',
  'synclife123', '11111111', '00000000', 'asdf1234', 'zxcvbnm1', 'india123', 'monkey123'
]);

export const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,30}$/;

export type PasswordRule = { label: string; met: boolean };

export function passwordRules(password: string, username: string): PasswordRule[] {
  const lower = password.toLowerCase();
  const user = username.trim().toLowerCase();
  return [
    { label: `At least ${PASSWORD_MIN} characters`, met: password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX },
    { label: 'Contains a letter and a number', met: /[a-zA-Z]/.test(password) && /\d/.test(password) },
    {
      label: 'Not a common password or your username',
      met: password.length > 0 && !COMMON_PASSWORDS.has(lower) && !(user.length >= 3 && lower.includes(user))
    }
  ];
}

export type PasswordStrength = { score: 0 | 1 | 2 | 3 | 4; label: string; color: string };

/** Rough 0–4 strength score for the meter. Not a security guarantee — just nudges toward longer, varied passwords. */
export function passwordStrength(password: string, username: string): PasswordStrength {
  if (!password) return { score: 0, label: '', color: '#2E2935' };
  const rulesMet = passwordRules(password, username).every((r) => r.met);
  let points = 0;
  if (password.length >= PASSWORD_MIN) points += 1;
  if (password.length >= 12) points += 1;
  if (password.length >= 16) points += 1;
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z0-9]/].filter((re) => re.test(password)).length;
  if (classes >= 3) points += 1;
  if (classes === 4) points += 1;
  if (/(.)\1{2,}/.test(password)) points -= 1; // "aaa", "111"

  const score = (rulesMet ? Math.max(1, Math.min(4, points)) : 1) as PasswordStrength['score'];
  return [
    { score: 0, label: '', color: '#2E2935' },
    { score: 1, label: 'Weak', color: '#FF4D4D' },
    { score: 2, label: 'Fair', color: '#FFB020' },
    { score: 3, label: 'Good', color: '#9BE15D' },
    { score: 4, label: 'Strong', color: '#3DDC84' }
  ][score] as PasswordStrength;
}

export function isPasswordValid(password: string, username: string) {
  return passwordRules(password, username).every((r) => r.met);
}
