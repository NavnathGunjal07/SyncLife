import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { getRandomActionQuote } from '../constants/quotes';
import { UserProfile } from '../types';
import { resolveWaterGoal } from '../utils/calculators';
import { toISODate } from '../utils/date';
import { readDayLogs } from './localCache';
import { showProgressNotification } from './notifications';

const TASK = 'synclife-progress-refresh';
const clampPct = (n: number) => Math.max(0, Math.min(100, n));

/**
 * Recomputes today's progress from the on-device cache (the app can't run React
 * in the background, so we read AsyncStorage directly) and refreshes the ongoing
 * progress notification. Safe to call from a headless background task.
 */
export async function refreshProgressFromCache() {
  const today = toISODate();
  const logs = await readDayLogs(today);

  let profile: UserProfile | null = null;
  let streak = 0;
  try {
    const raw = await AsyncStorage.getItem('synclife_user_profile');
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { profile?: UserProfile; streak?: number } };
      profile = parsed.state?.profile ?? null;
      streak = parsed.state?.streak ?? 0;
    }
  } catch {
    // no persisted profile
  }
  if (!profile) return;

  const caloriesConsumed = logs.meals.reduce((s, m) => s + m.totalCalories, 0);
  const waterMl = logs.water.reduce((s, w) => s + w.amountMl, 0);
  const workoutCompleted = logs.workouts.some((w) => w.completed);
  const calorieTarget = profile.calorieTarget || 2200;
  const waterGoal = resolveWaterGoal(profile);

  const overall = Math.round(
    (clampPct((caloriesConsumed / calorieTarget) * 100) +
      clampPct(waterGoal ? (waterMl / waterGoal) * 100 : 0) +
      (workoutCompleted ? 100 : 0)) /
      3
  );

  await showProgressNotification({
    overall,
    streak,
    caloriesConsumed,
    calorieTarget,
    waterMl,
    waterGoalMl: waterGoal,
    workoutLabel: workoutCompleted ? 'Completed' : 'Pending',
    quote: getRandomActionQuote().text
  });
}

// Defined at module scope so the OS can invoke it while the app is backgrounded.
TaskManager.defineTask(TASK, async () => {
  try {
    await refreshProgressFromCache();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/** Registers the periodic background refresh (best-effort; OS controls timing). */
export async function registerBackgroundRefresh() {
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) return;
    const registered = await TaskManager.isTaskRegisteredAsync(TASK);
    if (!registered) {
      await BackgroundTask.registerTaskAsync(TASK, { minimumInterval: 15 });
    }
  } catch {
    // background tasks unavailable — foreground updates still work
  }
}
