import {
  DailySummary,
  GoldEntry,
  MealLog,
  QueuedWrite,
  SheetName,
  Transaction,
  UserProfile,
  WaterLog,
  WorkoutLog
} from '../types/index.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

const MOCK_GOLD_PRICE_PER_GRAM = 6200;

const MEAL_NAMES: Record<string, string> = {
  '1': 'Poha',
  '2': 'Idli Sambar',
  '3': 'Upma',
  '4': 'Dal Rice',
  '5': 'Paneer Curry + Roti',
  '6': 'Chicken Curry + Rice',
  '7': 'Khichdi',
  '8': 'Banana',
  '9': 'Peanut Chaat'
};

const MEAL_TYPES: Record<string, string> = {
  '1': 'Breakfast',
  '2': 'Breakfast',
  '3': 'Breakfast',
  '4': 'Lunch',
  '5': 'Lunch',
  '6': 'Dinner',
  '7': 'Dinner',
  '8': 'Snacks',
  '9': 'Snacks'
};

const SHEET_HEADERS: Record<SheetName, string[]> = {
  Calories: ['Date', 'Meal', 'Type', 'Qty', 'Calories', 'Protein'],
  Workout: ['Date', 'Day', 'Exercises', 'Duration (min)', 'Cal Burned', 'Completed'],
  Water: ['Date', 'Time', 'Amount (ml)', 'Daily Total (ml)', 'Goal (ml)'],
  Money: ['Date', 'Type', 'Category', 'Amount (₹)', 'Notes'],
  Gold: ['Date', 'Category', 'Grams', 'Buy Price (₹/g)', 'Total Cost', 'Current Value', 'P&L'],
  Daily_Summary: [
    'Date',
    'Calories In',
    'Calories Burned',
    'Net Calories',
    'Water',
    'Water Goal',
    'Spend',
    'Workout Done',
    'Streak',
    'Completion %'
  ],
  Goals: [
    'Updated At',
    'Weight (kg)',
    'Height (cm)',
    'Fitness Goal',
    'Calorie Target',
    'Water Goal (ml)',
    'Water Goal Mode',
    'Monthly Budget'
  ],
  Meal_Plans: ['Date', 'Breakfast', 'Lunch', 'Dinner', 'Snacks']
};

const SHEET_NAMES = Object.keys(SHEET_HEADERS) as SheetName[];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Generic fetch wrapper with Bearer auth, Content-Type JSON, and retry on failure.
 */
async function requestJson<T>(
  url: string,
  token: string,
  init: RequestInit = {},
  attempts = 3
): Promise<T> {
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
        throw new Error(text || `Google Sheets request failed with status ${response.status}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown Google Sheets error');
      if (attempt < attempts - 1) {
        await sleep(500 * 2 ** attempt); // exponential backoff: 500ms, 1s, 2s
      }
    }
  }

  throw lastError ?? new Error('Google Sheets request failed after retries');
}

// ─── Spreadsheet Setup ───────────────────────────────────────────────────────

/**
 * Creates a new SyncLife spreadsheet with all required tabs and header rows.
 * Returns the new spreadsheet ID.
 */
export async function createSpreadsheet(token: string): Promise<string> {
  const spreadsheet = await requestJson<{ spreadsheetId: string }>(SHEETS_API, token, {
    method: 'POST',
    body: JSON.stringify({
      properties: { title: `SyncLife Data ${new Date().toLocaleDateString('en-IN')}` },
      sheets: SHEET_NAMES.map((title) => ({ properties: { title } }))
    })
  });

  const id = spreadsheet.spreadsheetId;

  // Write header rows to all sheets in one batch
  await requestJson(`${SHEETS_API}/${id}/values:batchUpdate`, token, {
    method: 'POST',
    body: JSON.stringify({
      valueInputOption: 'RAW',
      data: SHEET_NAMES.map((name) => ({
        range: `${name}!A1:Z1`,
        values: [SHEET_HEADERS[name]]
      }))
    })
  });

  return id;
}

// ─── Row Operations ──────────────────────────────────────────────────────────

/**
 * Appends a single row to the given sheet.
 */
export async function appendRow(
  token: string,
  spreadsheetId: string,
  sheetName: string,
  values: Array<string | number | boolean>
): Promise<void> {
  await requestJson(
    `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(`${sheetName}!A:Z`)}:append?valueInputOption=USER_ENTERED`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({ values: [values] })
    }
  );
}

/**
 * Reads all rows from a sheet and returns them as typed records keyed by header.
 */
export async function fetchSheetRows<T>(
  token: string,
  spreadsheetId: string,
  sheetName: string
): Promise<T[]> {
  const result = await requestJson<{ values?: string[][] }>(
    `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(`${sheetName}!A:Z`)}`,
    token
  );

  const [headers, ...rows] = result.values ?? [];
  if (!headers) return [];

  return rows.map((row) =>
    headers.reduce<Record<string, string>>((record, header, index) => {
      record[header] = row[index] ?? '';
      return record;
    }, {})
  ) as T[];
}

// ─── Log Appenders ───────────────────────────────────────────────────────────

export async function appendMealLog(
  token: string,
  spreadsheetId: string,
  log: MealLog
): Promise<void> {
  const name = MEAL_NAMES[log.mealId] ?? log.mealId;
  const type = MEAL_TYPES[log.mealId] ?? '';
  await appendRow(token, spreadsheetId, 'Calories', [
    log.date,
    name,
    type,
    log.quantity,
    log.totalCalories,
    log.totalProtein
  ]);
}

export async function appendWorkoutLog(
  token: string,
  spreadsheetId: string,
  log: WorkoutLog
): Promise<void> {
  await appendRow(token, spreadsheetId, 'Workout', [
    log.date,
    log.day,
    log.exercises.join(', '),
    log.durationMin,
    log.caloriesBurned,
    log.completed
  ]);
}

export async function appendWaterLog(
  token: string,
  spreadsheetId: string,
  log: WaterLog
): Promise<void> {
  await appendRow(token, spreadsheetId, 'Water', [
    log.date,
    log.time,
    log.amountMl,
    log.dailyTotalMl ?? '',
    log.goalMl ?? ''
  ]);
}

export async function appendTransaction(
  token: string,
  spreadsheetId: string,
  tx: Transaction
): Promise<void> {
  await appendRow(token, spreadsheetId, 'Money', [tx.date, tx.type, tx.category, tx.amount, tx.notes]);
}

export async function appendGoldEntry(
  token: string,
  spreadsheetId: string,
  entry: GoldEntry
): Promise<void> {
  const totalCost = entry.grams * entry.buyPrice;
  const currentValue = entry.grams * MOCK_GOLD_PRICE_PER_GRAM;
  await appendRow(token, spreadsheetId, 'Gold', [
    entry.date,
    entry.category,
    entry.grams,
    entry.buyPrice,
    totalCost,
    currentValue,
    currentValue - totalCost
  ]);
}

export async function writeDailySummary(
  token: string,
  spreadsheetId: string,
  summary: DailySummary
): Promise<void> {
  await appendRow(token, spreadsheetId, 'Daily_Summary', [
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

export async function writeGoals(
  token: string,
  spreadsheetId: string,
  profile: UserProfile
): Promise<void> {
  await appendRow(token, spreadsheetId, 'Goals', [
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

// ─── Queue Flush ─────────────────────────────────────────────────────────────

/**
 * Attempts to flush a single queued write. Throws on failure so the caller
 * can decide whether to retain or discard the item.
 */
export async function flushQueuedWrite(
  token: string,
  spreadsheetId: string,
  item: QueuedWrite
): Promise<void> {
  switch (item.type) {
    case 'meal':
      await appendMealLog(token, spreadsheetId, item.payload as MealLog);
      break;
    case 'workout':
      await appendWorkoutLog(token, spreadsheetId, item.payload as WorkoutLog);
      break;
    case 'water':
      await appendWaterLog(token, spreadsheetId, item.payload as WaterLog);
      break;
    case 'transaction':
      await appendTransaction(token, spreadsheetId, item.payload as Transaction);
      break;
    case 'gold':
      await appendGoldEntry(token, spreadsheetId, item.payload as GoldEntry);
      break;
    case 'summary':
      await writeDailySummary(token, spreadsheetId, item.payload as DailySummary);
      break;
    default:
      console.warn(`[sheetsService] Unknown queued write type: ${(item as QueuedWrite).type}`);
  }
}
