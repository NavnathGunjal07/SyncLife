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

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3001';

// ─── HTTP Helpers ─────────────────────────────────────────────────────────────

async function apiRequest<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {})
    }
  });
  if (response.status === 401) {
    throw new Error('Session expired. Please sign in again.');
  }
  if (!response.ok) {
    let message = `API error ${response.status}`;
    try {
      const data = (await response.json()) as { message?: string };
      message = data.message ?? message;
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

async function publicRequest<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = (await response.json()) as { message?: string };
      message = data.message ?? message;
    } catch {
      // ignore
    }
    throw new Error(message);
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
