import { create } from 'zustand';

import { appendWorkoutLog } from '../services/googleSheets';
import { mergeDayLogs } from '../services/localCache';
import { Level, WorkoutFocus, WorkoutLog, WorkoutMode } from '../types';
import { estimateCaloriesBurned, resolveExercises } from '../utils/aiHelpers';
import { getWeekDay, toISODate } from '../utils/date';
import { useAuthStore } from './auth';

type WorkoutState = {
  level: Level;
  mode: WorkoutMode;
  // Chosen training focus for today (null = follow the weekday's default).
  focus: WorkoutFocus | null;
  // Custom exercise-name list once the user adds/removes anything (null = use the
  // focus template unchanged).
  selection: string[] | null;
  checked: string[];
  startedAt: number | null;
  logs: WorkoutLog[];
  setLevel: (level: Level) => void;
  setMode: (mode: WorkoutMode) => void;
  hydrateFromProfile: (mode: WorkoutMode, level: Level) => void;
  setFocus: (focus: WorkoutFocus | null) => void;
  toggleInWorkout: (name: string) => void;
  toggleExercise: (name: string) => void;
  completeWorkout: () => Promise<boolean>;
  completedToday: () => boolean;
  setLogs: (logs: WorkoutLog[]) => void;
};

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  level: useAuthStore.getState().profile.workoutLevel,
  mode: useAuthStore.getState().profile.workoutMode,
  focus: null,
  selection: null,
  checked: [],
  startedAt: null,
  logs: [],
  // User edits: update local state AND persist the choice to the profile so it
  // survives reinstall/logout (updateProfile syncs to the backend best-effort).
  setLevel: (level) => {
    set({ level, checked: [], startedAt: null });
    void useAuthStore.getState().updateProfile({ workoutLevel: level });
  },
  setMode: (mode) => {
    set({ mode, checked: [], startedAt: null });
    void useAuthStore.getState().updateProfile({ workoutMode: mode });
  },
  // Seed from a server-sourced profile without POSTing back (used on hydration).
  hydrateFromProfile: (mode, level) => set({ mode, level }),
  // Pick a different focus for today; starts from that template fresh.
  setFocus: (focus) => set({ focus, selection: null, checked: [], startedAt: null }),
  // Add or remove an exercise from today's workout. Seeds the custom selection
  // from the current focus template the first time the user changes it.
  toggleInWorkout: (name) => {
    const { focus, selection, level, checked } = get();
    const current = selection ?? resolveExercises({ focus, selection: null, date: new Date(), level }).map((e) => e.name);
    const next = current.includes(name) ? current.filter((n) => n !== name) : [...current, name];
    set({ selection: next, checked: checked.filter((c) => next.includes(c)) });
  },
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
    const plan = resolveExercises({ focus: get().focus, selection: get().selection, date: new Date(), level: get().level });
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
