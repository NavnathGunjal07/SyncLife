/**
 * App-data hydration. Runs once the user is authenticated (post-login and on
 * cold start) to pull persisted data back into the in-memory stores. Without
 * this, every store starts empty on launch and history "disappears".
 *
 * Each section is independent and best-effort: a failed network call falls back
 * to the local AsyncStorage cache (today's data) so the app still shows
 * something offline.
 */
import {
  fetchAlarms,
  fetchGoals,
  fetchGoldEntries,
  fetchMealLogs,
  fetchTransactions,
  fetchWaterLogs,
  fetchWorkoutHistory,
  putAlarms,
  recordDailyLogin
} from './api';
import { readDayLogs } from './localCache';
import { useAuthStore } from '../store/auth';
import { useFinanceStore } from '../store/finance';
import { useGoldStore } from '../store/gold';
import { useMealsStore } from '../store/meals';
import { useMotivationStore } from '../store/motivation';
import { useWaterStore } from '../store/water';
import { useWorkoutStore } from '../store/workout';
import { UserProfile } from '../types';
import { toISODate } from '../utils/date';

let inFlight: Promise<void> | null = null;

function pickProfile(p: Partial<UserProfile>): Partial<UserProfile> {
  const out: Partial<UserProfile> = {};
  if (typeof p.weightKg === 'number') out.weightKg = p.weightKg;
  if (typeof p.heightCm === 'number') out.heightCm = p.heightCm;
  if (p.fitnessGoal) out.fitnessGoal = p.fitnessGoal;
  if (typeof p.calorieTarget === 'number') out.calorieTarget = p.calorieTarget;
  if (typeof p.waterGoalMl === 'number') out.waterGoalMl = p.waterGoalMl;
  if (p.waterGoalMode) out.waterGoalMode = p.waterGoalMode;
  if (typeof p.monthlyBudget === 'number') out.monthlyBudget = p.monthlyBudget;
  return out;
}

async function hydrateFromCache(date: string) {
  try {
    const cached = await readDayLogs(date);
    if (cached.meals.length) useMealsStore.getState().setLogs(cached.meals);
    if (cached.water.length) useWaterStore.getState().setLogs(cached.water);
    if (cached.workouts.length) useWorkoutStore.getState().setLogs(cached.workouts);
    if (cached.transactions.length) useFinanceStore.getState().setTransactions(cached.transactions);
    if (cached.gold.length) useGoldStore.getState().setEntries(cached.gold);
  } catch {
    // cache miss — nothing to restore
  }
}

async function run() {
  const token = useAuthStore.getState().accessToken;
  const today = toISODate();

  if (!token) {
    await hydrateFromCache(today);
    return;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Profile (does not overwrite a user mid-edit since this runs once on launch).
  try {
    const { profile } = await fetchGoals(token);
    if (profile) useAuthStore.getState().hydrateProfile(pickProfile(profile));
  } catch {
    /* keep existing profile */
  }

  // Daily login → server-computed streak.
  try {
    const { streak } = await recordDailyLogin(token, today);
    useAuthStore.getState().setStreak(streak);
  } catch {
    /* keep cached streak */
  }

  // Workout history (server returns newest-first; store ascending to match the
  // append convention used elsewhere).
  try {
    const { logs } = await fetchWorkoutHistory(token);
    useWorkoutStore.getState().setLogs([...logs].reverse());
  } catch {
    const cached = await readDayLogs(today);
    if (cached.workouts.length) useWorkoutStore.getState().setLogs(cached.workouts);
  }

  // Today's meals.
  try {
    const { logs } = await fetchMealLogs(token, today);
    useMealsStore.getState().setLogs(logs);
  } catch {
    const cached = await readDayLogs(today);
    if (cached.meals.length) useMealsStore.getState().setLogs(cached.meals);
  }

  // Today's water.
  try {
    const { logs } = await fetchWaterLogs(token, today);
    useWaterStore.getState().setLogs(logs);
  } catch {
    const cached = await readDayLogs(today);
    if (cached.water.length) useWaterStore.getState().setLogs(cached.water);
  }

  // This month's transactions.
  try {
    const { transactions } = await fetchTransactions(token, year, month);
    useFinanceStore.getState().setTransactions(transactions);
  } catch {
    const cached = await readDayLogs(today);
    if (cached.transactions.length) useFinanceStore.getState().setTransactions(cached.transactions);
  }

  // All gold entries.
  try {
    const { entries } = await fetchGoldEntries(token);
    useGoldStore.getState().setEntries(entries);
  } catch {
    const cached = await readDayLogs(today);
    if (cached.gold.length) useGoldStore.getState().setEntries(cached.gold);
  }

  // Motivation alarms: use the server copy when it has any; otherwise seed the
  // server from the local defaults so they aren't wiped on first sync.
  try {
    const { alarms } = await fetchAlarms(token);
    if (alarms.length > 0) {
      await useMotivationStore.getState().hydrateFromServer(alarms);
    } else {
      void putAlarms(token, useMotivationStore.getState().alarms).catch(() => undefined);
    }
  } catch {
    /* keep locally persisted alarms */
  }
}

/** Hydrate all stores from the backend (cache fallback). De-duped while running. */
export function hydrateAll(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = run().finally(() => {
    inFlight = null;
  });
  return inFlight;
}
