import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';

import { MEALS } from '../constants/meals';
import { MOCK_GOLD_PRICE_PER_GRAM } from '../constants/finance';
import { SHEET_HEADERS, SHEET_NAMES } from '../constants/sheets';
import { DailySummary, GoldEntry, MealLog, QueuedWrite, Transaction, WaterLog, WorkoutLog } from '../types';
import { makeId } from '../utils/date';

const SPREADSHEET_ID_KEY = 'synclife_spreadsheet_id';
const QUEUE_KEY = 'synclife_sync_queue';
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function assertOnline() {
  const net = await NetInfo.fetch();
  return Boolean(net.isConnected && net.isInternetReachable !== false);
}

async function requestJson<T>(url: string, token: string, init: RequestInit = {}, attempts = 3): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(init.headers ?? {})
        }
      });
      if (response.status === 401) {
        throw new Error('Google authorization expired. Please sign in again.');
      }
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Google Sheets request failed with ${response.status}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown Google Sheets error');
      if (attempt < attempts - 1) {
        await sleep(500 * 2 ** attempt);
      }
    }
  }
  throw lastError ?? new Error('Google Sheets request failed');
}

export async function getSpreadsheetId() {
  return AsyncStorage.getItem(SPREADSHEET_ID_KEY);
}

export async function createSheets(accessToken: string): Promise<void> {
  const existingId = await getSpreadsheetId();
  if (existingId) {
    return;
  }

  const spreadsheet = await requestJson<{ spreadsheetId: string }>(SHEETS_API, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      properties: { title: `SyncLife Data ${new Date().toLocaleDateString('en-IN')}` },
      sheets: SHEET_NAMES.map((title) => ({ properties: { title } }))
    })
  });

  await AsyncStorage.setItem(SPREADSHEET_ID_KEY, spreadsheet.spreadsheetId);

  await requestJson(`${SHEETS_API}/${spreadsheet.spreadsheetId}/values:batchUpdate`, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      valueInputOption: 'RAW',
      data: SHEET_NAMES.map((name) => ({
        range: `${name}!A1:Z1`,
        values: [SHEET_HEADERS[name]]
      }))
    })
  });
}

async function ensureSpreadsheetId(token: string) {
  const existing = await getSpreadsheetId();
  if (existing) {
    return existing;
  }
  await createSheets(token);
  const created = await getSpreadsheetId();
  if (!created) {
    throw new Error('SyncLife spreadsheet was not created.');
  }
  return created;
}

async function appendRows(token: string, sheetName: string, values: Array<string | number | boolean>) {
  const spreadsheetId = await ensureSpreadsheetId(token);
  await requestJson(`${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(`${sheetName}!A:Z`)}:append?valueInputOption=USER_ENTERED`, token, {
    method: 'POST',
    body: JSON.stringify({ values: [values] })
  });
}

async function readQueue(): Promise<QueuedWrite[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? (JSON.parse(raw) as QueuedWrite[]) : [];
}

async function writeQueue(queue: QueuedWrite[]) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function queueWrite(write: Omit<QueuedWrite, 'id' | 'createdAt' | 'attempts'>) {
  const queue = await readQueue();
  await writeQueue([...queue, { ...write, id: makeId('queue'), createdAt: new Date().toISOString(), attempts: 0 }]);
}

async function appendOrQueue(token: string, write: Omit<QueuedWrite, 'id' | 'createdAt' | 'attempts'>, append: () => Promise<void>) {
  if (!(await assertOnline())) {
    await queueWrite(write);
    Toast.show({ type: 'info', text1: 'Offline mode', text2: 'Saved locally and will sync later.' });
    return;
  }
  try {
    await append();
  } catch (error) {
    await queueWrite(write);
    Toast.show({
      type: 'error',
      text1: 'Sync failed',
      text2: error instanceof Error ? error.message : 'Saved to the retry queue.'
    });
  }
}

export async function appendMealLog(token: string, log: MealLog): Promise<void> {
  await appendOrQueue(token, { type: 'meal', payload: log }, async () => {
    const meal = MEALS.find((item) => item.id === log.mealId);
    await appendRows(token, 'Calories', [log.date, meal?.name ?? log.mealId, meal?.type ?? '', log.quantity, log.totalCalories, log.totalProtein]);
  });
}

export async function appendWorkoutLog(token: string, log: WorkoutLog): Promise<void> {
  await appendOrQueue(token, { type: 'workout', payload: log }, async () => {
    await appendRows(token, 'Workout', [
      log.date,
      log.day,
      log.exercises.join(', '),
      log.durationMin,
      log.caloriesBurned,
      log.completed
    ]);
  });
}

export async function appendWaterLog(token: string, log: WaterLog): Promise<void> {
  await appendOrQueue(token, { type: 'water', payload: log }, async () => {
    await appendRows(token, 'Water', [log.date, log.time, log.amountMl, log.dailyTotalMl ?? '', log.goalMl ?? '']);
  });
}

export async function appendTransaction(token: string, tx: Transaction): Promise<void> {
  await appendOrQueue(token, { type: 'transaction', payload: tx }, async () => {
    await appendRows(token, 'Money', [tx.date, tx.type, tx.category, tx.amount, tx.notes]);
  });
}

export async function appendGoldEntry(token: string, entry: GoldEntry): Promise<void> {
  await appendOrQueue(token, { type: 'gold', payload: entry }, async () => {
    const totalCost = entry.grams * entry.buyPrice;
    const currentValue = entry.grams * MOCK_GOLD_PRICE_PER_GRAM;
    await appendRows(token, 'Gold', [
      entry.date,
      entry.category,
      entry.grams,
      entry.buyPrice,
      totalCost,
      currentValue,
      currentValue - totalCost
    ]);
  });
}

export async function fetchSheetRows<T>(token: string, sheetName: string): Promise<T[]> {
  const spreadsheetId = await ensureSpreadsheetId(token);
  const result = await requestJson<{ values?: string[][] }>(
    `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(`${sheetName}!A:Z`)}`,
    token
  );
  const [headers, ...rows] = result.values ?? [];
  if (!headers) {
    return [];
  }
  return rows.map((row) =>
    headers.reduce<Record<string, string>>((record, header, index) => {
      record[header] = row[index] ?? '';
      return record;
    }, {})
  ) as T[];
}

export async function writeDailySummary(token: string, summary: DailySummary): Promise<void> {
  await appendOrQueue(token, { type: 'summary', payload: summary }, async () => {
    await appendRows(token, 'Daily_Summary', [
      summary.date,
      summary.caloriesConsumed,
      summary.caloriesBurned,
      summary.netCalories,
      summary.waterMl,
      summary.waterGoalMl,
      summary.spend,
      summary.workoutCompleted,
      summary.streak,
      summary.completionPercent
    ]);
  });
}

export async function writeGoals(token: string, profile: {
  weightKg: number;
  heightCm: number;
  fitnessGoal: string;
  calorieTarget: number;
  waterGoalMl: number;
  waterGoalMode: string;
  monthlyBudget: number;
}) {
  await appendRows(token, 'Goals', [
    new Date().toISOString(),
    profile.weightKg,
    profile.heightCm,
    profile.fitnessGoal,
    profile.calorieTarget,
    profile.waterGoalMl,
    profile.waterGoalMode,
    profile.monthlyBudget
  ]);
}

async function appendQueuedWrite(token: string, item: QueuedWrite) {
  if (item.type === 'meal') {
    const log = item.payload as MealLog;
    const meal = MEALS.find((mealItem) => mealItem.id === log.mealId);
    await appendRows(token, 'Calories', [log.date, meal?.name ?? log.mealId, meal?.type ?? '', log.quantity, log.totalCalories, log.totalProtein]);
  }
  if (item.type === 'workout') {
    const log = item.payload as WorkoutLog;
    await appendRows(token, 'Workout', [log.date, log.day, log.exercises.join(', '), log.durationMin, log.caloriesBurned, log.completed]);
  }
  if (item.type === 'water') {
    const log = item.payload as WaterLog;
    await appendRows(token, 'Water', [log.date, log.time, log.amountMl, log.dailyTotalMl ?? '', log.goalMl ?? '']);
  }
  if (item.type === 'transaction') {
    const tx = item.payload as Transaction;
    await appendRows(token, 'Money', [tx.date, tx.type, tx.category, tx.amount, tx.notes]);
  }
  if (item.type === 'gold') {
    const entry = item.payload as GoldEntry;
    const totalCost = entry.grams * entry.buyPrice;
    const currentValue = entry.grams * MOCK_GOLD_PRICE_PER_GRAM;
    await appendRows(token, 'Gold', [entry.date, entry.category, entry.grams, entry.buyPrice, totalCost, currentValue, currentValue - totalCost]);
  }
  if (item.type === 'summary') {
    const summary = item.payload as DailySummary;
    await appendRows(token, 'Daily_Summary', [
      summary.date,
      summary.caloriesConsumed,
      summary.caloriesBurned,
      summary.netCalories,
      summary.waterMl,
      summary.waterGoalMl,
      summary.spend,
      summary.workoutCompleted,
      summary.streak,
      summary.completionPercent
    ]);
  }
}

export async function flushQueue(token: string): Promise<number> {
  if (!(await assertOnline())) {
    return 0;
  }
  const queue = await readQueue();
  const remaining: QueuedWrite[] = [];
  let flushed = 0;

  for (const item of queue) {
    try {
      await appendQueuedWrite(token, item);
      flushed += 1;
    } catch {
      if (item.attempts + 1 < 3) {
        remaining.push({ ...item, attempts: item.attempts + 1 });
      }
    }
  }

  await writeQueue(remaining);
  return flushed;
}

export async function getQueueSize() {
  return (await readQueue()).length;
}
