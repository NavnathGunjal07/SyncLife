import {
  ChatSession,
  ChatTurnResult,
  DailySummary,
  GoldEntry,
  HabitMonth,
  HabitYear,
  MealHistoryItem,
  MealLog,
  MotivationAlarm,
  ParsedMeal,
  SavedMemory,
  Transaction,
  WaterLog,
  WorkoutLog
} from '../types';
import { ChatMessage as ChatMessageType } from '../types';
import { UserProfile } from '../types';

export const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3001';

// ─── HTTP Helpers ─────────────────────────────────────────────────────────────

const REQUEST_TIMEOUT_MS = 20000;

// Registered by the auth store (it imports this module, so it can't be imported back).
// Called once when any authenticated request comes back 401 so the app signs out
// instead of leaving the user stuck on a dead session.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { message?: string };
    return data.message ?? fallback;
  } catch {
    return fallback;
  }
}

async function send(path: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(`${API_BASE}${path}`, { ...init, signal: init.signal ?? controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('The server took too long to respond. Please try again.');
    }
    throw new Error("Can't reach SyncLife. Check your internet connection.");
  } finally {
    clearTimeout(timeout);
  }
}

async function apiRequest<T>(path: string, token: string | null | undefined, init: RequestInit = {}): Promise<T> {
  // Never send "Bearer null" — a missing token means the user isn't signed in.
  if (!token) {
    throw new Error('You are not signed in.');
  }
  const response = await send(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`
    }
  });
  if (response.status === 401) {
    onUnauthorized?.();
    throw new Error('Session expired. Please sign in again.');
  }
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, `API error ${response.status}`));
  }
  return response.json() as Promise<T>;
}

async function publicRequest<T>(path: string, body?: unknown): Promise<T> {
  const response = await send(
    path,
    body === undefined
      ? { method: 'GET' }
      : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, `Request failed (${response.status})`));
  }
  return response.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  user: { id: string; username: string; name: string };
}

export function register(username: string, password: string, name: string) {
  return publicRequest<AuthResponse>('/api/auth/register', { username, password, name });
}

export function login(username: string, password: string) {
  return publicRequest<AuthResponse>('/api/auth/login', { username, password });
}

export function checkUsernameAvailable(username: string) {
  return publicRequest<{ available: boolean; message?: string }>(
    `/api/auth/username-available?username=${encodeURIComponent(username)}`
  );
}

/** Validates the stored token server-side; a 401 here signs the user out via the unauthorized handler. */
export function fetchMe(token: string) {
  return apiRequest<{ user: AuthResponse['user'] }>('/api/auth/me', token);
}

/** Permanently deletes the account and all server-side data. */
export function deleteAccount(token: string, password: string) {
  return apiRequest<{ deleted: boolean }>('/api/auth/account', token, {
    method: 'DELETE',
    body: JSON.stringify({ password })
  });
}

// ─── AI content reports ───────────────────────────────────────────────────────

export type ReportReason = 'offensive' | 'harmful' | 'inaccurate' | 'other';

export function reportAiMessage(
  token: string,
  report: { messageId?: string; content: string; reason: ReportReason; details?: string }
) {
  return apiRequest<{ id: string }>('/api/chat/report', token, {
    method: 'POST',
    body: JSON.stringify(report)
  });
}

// ─── Meal Logs ────────────────────────────────────────────────────────────────

export function postMealLog(token: string, log: MealLog & { mealName?: string; mealType?: string }) {
  return apiRequest<{ success: boolean }>('/api/logs/meal', token, {
    method: 'POST',
    body: JSON.stringify({ log })
  });
}

export function fetchMealLogs(token: string, date: string) {
  return apiRequest<{ logs: MealLog[] }>(`/api/logs/meals?date=${date}`, token);
}

export function fetchMealHistory(token: string, limit = 200) {
  return apiRequest<{ logs: MealHistoryItem[] }>(`/api/logs/meals/history?limit=${limit}`, token);
}

// AI: turn free text ("2 rotis and dal") into a structured, savable meal draft.
export function parseMeal(token: string, text: string) {
  return apiRequest<{ meal: ParsedMeal }>('/api/logs/meal/parse', token, {
    method: 'POST',
    body: JSON.stringify({ text })
  });
}

// ─── Workout Logs ─────────────────────────────────────────────────────────────

export function postWorkoutLog(token: string, log: WorkoutLog) {
  return apiRequest<{ success: boolean }>('/api/logs/workout', token, {
    method: 'POST',
    body: JSON.stringify({ log })
  });
}

export function fetchWorkoutLogs(token: string, date: string) {
  return apiRequest<{ logs: WorkoutLog[] }>(`/api/logs/workouts?date=${date}`, token);
}

export function fetchWorkoutHistory(token: string, limit = 60) {
  return apiRequest<{ logs: WorkoutLog[] }>(`/api/logs/workouts/history?limit=${limit}`, token);
}

// ─── Water Logs ───────────────────────────────────────────────────────────────

export function postWaterLog(token: string, log: WaterLog) {
  return apiRequest<{ success: boolean }>('/api/logs/water', token, {
    method: 'POST',
    body: JSON.stringify({ log })
  });
}

export function fetchWaterLogs(token: string, date: string) {
  return apiRequest<{ logs: WaterLog[] }>(`/api/logs/water?date=${date}`, token);
}

export function fetchWaterHistory(token: string, limit = 300) {
  return apiRequest<{ logs: WaterLog[] }>(`/api/logs/water/history?limit=${limit}`, token);
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export function postTransaction(token: string, tx: Transaction) {
  return apiRequest<{ success: boolean }>('/api/logs/transaction', token, {
    method: 'POST',
    body: JSON.stringify({ tx })
  });
}

export function fetchTransactions(token: string, year: number, month: number) {
  return apiRequest<{ transactions: Transaction[] }>(
    `/api/logs/transactions?year=${year}&month=${month}`,
    token
  );
}

// ─── Gold Entries ─────────────────────────────────────────────────────────────

export function postGoldEntry(token: string, entry: GoldEntry) {
  return apiRequest<{ success: boolean }>('/api/logs/gold', token, {
    method: 'POST',
    body: JSON.stringify({ entry })
  });
}

export function fetchGoldEntries(token: string) {
  return apiRequest<{ entries: GoldEntry[] }>('/api/logs/gold', token);
}

// ─── Daily Summary ────────────────────────────────────────────────────────────

export function postDailySummary(token: string, summary: DailySummary) {
  return apiRequest<{ success: boolean }>('/api/logs/summary', token, {
    method: 'POST',
    body: JSON.stringify({ summary })
  });
}

export function fetchDailySummary(token: string, date: string) {
  return apiRequest<{ summary: DailySummary | null }>(`/api/logs/summary?date=${date}`, token);
}

// ─── Goals / Profile ──────────────────────────────────────────────────────────

export function postGoals(token: string, profile: UserProfile) {
  return apiRequest<{ success: boolean }>('/api/goals', token, {
    method: 'POST',
    body: JSON.stringify({ profile })
  });
}

export function fetchGoals(token: string) {
  return apiRequest<{ profile: UserProfile | null }>('/api/goals', token);
}

// ─── Daily Login / Streak ─────────────────────────────────────────────────────

export function recordDailyLogin(token: string, date: string) {
  return apiRequest<{ streak: number; lastActiveDate: string }>('/api/streak/login', token, {
    method: 'POST',
    body: JSON.stringify({ date })
  });
}

// ─── Motivation Alarms ────────────────────────────────────────────────────────

export function fetchAlarms(token: string) {
  return apiRequest<{ alarms: MotivationAlarm[] }>('/api/alarms', token);
}

export function putAlarms(token: string, alarms: MotivationAlarm[]) {
  return apiRequest<{ alarms: MotivationAlarm[] }>('/api/alarms', token, {
    method: 'PUT',
    body: JSON.stringify({ alarms })
  });
}

// ─── AI Assistant Chat ────────────────────────────────────────────────────────

export function sendChat(token: string, message: string, date: string) {
  return apiRequest<ChatTurnResult>('/api/chat', token, {
    method: 'POST',
    body: JSON.stringify({ message, date })
  });
}

export function fetchChatSession(token: string, date: string) {
  return apiRequest<ChatSession>(`/api/chat/session?date=${date}`, token);
}

export interface StoredChatMessage {
  id: string;
  role: string;
  content: string;
  kind: string;
  data: { cards?: ChatMessageType['cards']; options?: string[] };
  createdAt: string;
}

export function fetchChatHistory(token: string, limit = 40) {
  return apiRequest<{ messages: StoredChatMessage[] }>(`/api/chat/history?limit=${limit}`, token);
}

// ─── Habits ───────────────────────────────────────────────────────────────────

export function fetchHabitMonth(token: string, month: string) {
  return apiRequest<HabitMonth>(`/api/habits?month=${month}`, token);
}

export function fetchHabitYear(token: string, year: string) {
  return apiRequest<HabitYear>(`/api/habits/year?year=${year}`, token);
}

export function createHabit(
  token: string,
  input: { name: string; color: string; icon?: string; source?: string }
) {
  return apiRequest<{ habit: { id: string } }>('/api/habits', token, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export function toggleHabit(token: string, id: string, date: string, done: boolean) {
  return apiRequest<{ success: boolean }>(`/api/habits/${id}/toggle`, token, {
    method: 'POST',
    body: JSON.stringify({ date, done })
  });
}

export function deleteHabit(token: string, id: string) {
  return apiRequest<{ success: boolean }>(`/api/habits/${id}`, token, { method: 'DELETE' });
}

export function addHabitDefaults(token: string, date: string) {
  return apiRequest<{ added: string[] }>('/api/habits/defaults', token, {
    method: 'POST',
    body: JSON.stringify({ date })
  });
}

// ─── Long-term Memory ─────────────────────────────────────────────────────────

export function fetchMemory(token: string) {
  return apiRequest<{ memories: SavedMemory[] }>('/api/memory', token);
}

export function confirmMemory(token: string, id: string) {
  return apiRequest<{ success: boolean }>('/api/memory/confirm', token, {
    method: 'POST',
    body: JSON.stringify({ id })
  });
}

export function deleteMemory(token: string, id: string) {
  return apiRequest<{ success: boolean }>(`/api/memory/${id}`, token, { method: 'DELETE' });
}
