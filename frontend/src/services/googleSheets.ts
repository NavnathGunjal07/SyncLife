/**
 * Data service — all functions preserved from original Google Sheets implementation.
 * Now calls the SyncLife Express/PostgreSQL backend instead.
 */
import Toast from 'react-native-toast-message';

import { MEALS } from '../constants/meals';
import { DailySummary, GoldEntry, MealLog, Transaction, WaterLog, WorkoutLog } from '../types';
import {
  postMealLog,
  postWorkoutLog,
  postWaterLog,
  postTransaction,
  postGoldEntry,
  postDailySummary,
  postGoals
} from './api';
import { UserProfile } from '../types';

// ─── Write Helpers ────────────────────────────────────────────────────────────

async function writeOrToast(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (error) {
    Toast.show({
      type: 'error',
      text1: `${label} failed`,
      text2: error instanceof Error ? error.message : 'Please try again.'
    });
  }
}

// ─── Meal ─────────────────────────────────────────────────────────────────────

export async function appendMealLog(token: string, log: MealLog): Promise<void> {
  const meal = MEALS.find((item) => item.id === log.mealId);
  await writeOrToast('Meal sync', () =>
    postMealLog(token, {
      ...log,
      mealName: meal?.name ?? log.mealId,
      mealType: meal?.type ?? ''
    })
  );
}

// ─── Workout ──────────────────────────────────────────────────────────────────

export async function appendWorkoutLog(token: string, log: WorkoutLog): Promise<void> {
  await writeOrToast('Workout sync', () => postWorkoutLog(token, log));
}

// ─── Water ────────────────────────────────────────────────────────────────────

export async function appendWaterLog(token: string, log: WaterLog): Promise<void> {
  await writeOrToast('Water sync', () => postWaterLog(token, log));
}

// ─── Finance ──────────────────────────────────────────────────────────────────

export async function appendTransaction(token: string, tx: Transaction): Promise<void> {
  await writeOrToast('Transaction sync', () => postTransaction(token, tx));
}

// ─── Gold ─────────────────────────────────────────────────────────────────────

export async function appendGoldEntry(token: string, entry: GoldEntry): Promise<void> {
  await writeOrToast('Gold sync', () => postGoldEntry(token, entry));
}

// ─── Daily Summary ────────────────────────────────────────────────────────────

export async function writeDailySummary(token: string, summary: DailySummary): Promise<void> {
  await writeOrToast('Summary sync', () => postDailySummary(token, summary));
}

// ─── Goals / Profile ──────────────────────────────────────────────────────────

export async function writeGoals(token: string, profile: UserProfile): Promise<void> {
  await writeOrToast('Profile sync', () => postGoals(token, profile));
}

// ─── Queue Stubs (no-ops — backend has persistent DB, no queue needed) ────────

export async function flushQueue(_token: string): Promise<number> {
  return 0;
}

export async function getQueueSize(): Promise<number> {
  return 0;
}
