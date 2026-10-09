import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { getTodaySteps, hasStepPermission, isStepTrackingAvailable, requestStepPermission, watchSteps } from '../services/pedometer';
import { toISODate } from '../utils/date';

const KEY = 'synclife_steps';
export const STEP_GOAL = 10000;

type Permission = 'unknown' | 'granted' | 'denied';

type StepsState = {
  steps: number;
  goal: number;
  available: boolean;
  permission: Permission;
  tracking: boolean;
  _base: number; // daily total accumulated before the current watch session
  _date: string;
  _stop: (() => void) | null;
  /**
   * Starts tracking if the activity permission is granted. Only shows the system
   * prompt when `prompt` is true — i.e. from a user tap after our in-app
   * disclosure (Play's prominent-disclosure rule), never on app start.
   */
  init: (prompt?: boolean) => Promise<void>;
  stop: () => void;
};

export const useStepsStore = create<StepsState>((set, get) => ({
  steps: 0,
  goal: STEP_GOAL,
  available: false,
  permission: 'unknown',
  tracking: false,
  _base: 0,
  _date: toISODate(),
  _stop: null,

  init: async (prompt = false) => {
    if (get().tracking) return;
    const available = await isStepTrackingAvailable();
    set({ available });
    if (!available) return;

    if (prompt) {
      const granted = await requestStepPermission();
      set({ permission: granted ? 'granted' : 'denied' });
      if (!granted) return;
    } else {
      const granted = await hasStepPermission();
      if (!granted) {
        // Leave a previous 'denied' in place; otherwise it's simply not asked yet.
        if (get().permission !== 'denied') set({ permission: 'unknown' });
        return;
      }
      set({ permission: 'granted' });
    }

    const today = toISODate();
    let base = 0;
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { date: string; steps: number };
        if (saved.date === today) base = saved.steps ?? 0;
      }
    } catch {
      // no saved steps
    }
    // Platforms with a historical API (iOS/HealthKit — which also merges Apple
    // Watch steps) give an accurate all-day total; Android returns null.
    const historical = await getTodaySteps();
    if (historical != null) base = Math.max(base, historical);

    set({ _base: base, _date: today, steps: base, tracking: true });

    const stop = watchSteps((sessionSteps) => {
      const state = get();
      const now = toISODate();
      let dayBase = state._base;
      if (now !== state._date) {
        dayBase = 0;
        set({ _base: 0, _date: now });
      }
      const steps = dayBase + sessionSteps;
      set({ steps });
      void AsyncStorage.setItem(KEY, JSON.stringify({ date: now, steps }));
    });
    set({ _stop: stop });
  },

  stop: () => {
    get()._stop?.();
    set({ tracking: false, _stop: null });
  }
}));
