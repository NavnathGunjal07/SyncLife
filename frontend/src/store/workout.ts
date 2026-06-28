import { create } from 'zustand';

import { appendWorkoutLog } from '../services/googleSheets';
import { mergeDayLogs } from '../services/localCache';
import { Level, WorkoutLog, WorkoutMode } from '../types';
import { estimateCaloriesBurned, getDailyWorkout } from '../utils/aiHelpers';
import { getWeekDay, toISODate } from '../utils/date';
import { useAuthStore } from './auth';

type WorkoutState = {
  level: Level;
  mode: WorkoutMode;
  checked: string[];
  startedAt: number | null;
  logs: WorkoutLog[];
  setLevel: (level: Level) => void;
  setMode: (mode: WorkoutMode) => void;
  toggleExercise: (name: string) => void;
  completeWorkout: () => Promise<boolean>;
  completedToday: () => boolean;
  setLogs: (logs: WorkoutLog[]) => void;
};

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  level: 'Beginner',
  mode: 'Home',
  checked: [],
  startedAt: null,
  logs: [],
  setLevel: (level) => set({ level, checked: [], startedAt: null }),
  setMode: (mode) => set({ mode, checked: [], startedAt: null }),
  toggleExercise: (name) => {
    const checked = get().checked.includes(name) ? get().checked.filter((item) => item !== name) : [...get().checked, name];
    set({ checked, startedAt: get().startedAt ?? Date.now() });
  },
  completeWorkout: async () => {
    // One workout may be marked complete per day. Bail out (without creating a
    // duplicate) if today is already logged — the DB enforces this too via the
    // unique (userId, date) upsert, this keeps local state honest.
    if (get().completedToday()) {
      return false;
    }
    const profile = useAuthStore.getState().profile;
    const startedAt = get().startedAt ?? Date.now();
    const durationMin = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
    const plan = getDailyWorkout(new Date(), get().level);
    const exercises = get().checked.length ? get().checked : plan.map((item) => item.name);
    const log: WorkoutLog = {
      date: toISODate(),
      day: getWeekDay(),
      exercises,
      durationMin,
      caloriesBurned: estimateCaloriesBurned(exercises, durationMin, profile.weightKg),
      completed: true
    };
    const logs = [...get().logs, log];
    set({ logs, checked: [], startedAt: null });
    await mergeDayLogs(log.date, { workouts: logs.filter((item) => item.date === log.date) });
    const token = useAuthStore.getState().accessToken;
    if (token) {
      await appendWorkoutLog(token, log);
    }
    return true;
  },
  completedToday: () => get().logs.some((log) => log.date === toISODate() && log.completed),
  setLogs: (logs) => set({ logs })
}));
