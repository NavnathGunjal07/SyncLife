import AsyncStorage from '@react-native-async-storage/async-storage';

import { GoldEntry, MealLog, Transaction, WaterLog, WorkoutLog } from '../types';
import { toISODate } from '../utils/date';

export type CachedDayLogs = {
  meals: MealLog[];
  workouts: WorkoutLog[];
  water: WaterLog[];
  transactions: Transaction[];
  gold: GoldEntry[];
};

const emptyLogs: CachedDayLogs = {
  meals: [],
  workouts: [],
  water: [],
  transactions: [],
  gold: []
};

export const dayLogKey = (date = toISODate()) => `synclife_logs_${date}`;

export async function readDayLogs(date = toISODate()): Promise<CachedDayLogs> {
  const raw = await AsyncStorage.getItem(dayLogKey(date));
  return raw ? { ...emptyLogs, ...(JSON.parse(raw) as Partial<CachedDayLogs>) } : emptyLogs;
}

export async function mergeDayLogs(date: string, patch: Partial<CachedDayLogs>) {
  const existing = await readDayLogs(date);
  await AsyncStorage.setItem(dayLogKey(date), JSON.stringify({ ...existing, ...patch }));
}
