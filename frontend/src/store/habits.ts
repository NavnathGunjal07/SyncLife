import { create } from 'zustand';

import {
  addHabitDefaults,
  createHabit as apiCreateHabit,
  deleteHabit as apiDeleteHabit,
  fetchHabitMonth,
  toggleHabit
} from '../services/api';
import { refreshDomains } from '../services/bootstrap';
import { Habit } from '../types';
import { toISODate } from '../utils/date';
import { useAuthStore } from './auth';

// Random colour + icon assigned to a new habit.
const HABIT_COLORS = ['#FF7A1A', '#3DD9FF', '#8B6CFF', '#FFB81F', '#FF4D4D', '#2DD4BF', '#FFD60A', '#60A5FA', '#FF8A3D', '#B57CFF'];
const HABIT_ICONS = ['star', 'flame', 'book', 'water', 'barbell', 'walk', 'moon', 'leaf', 'heart', 'musical-notes', 'brush', 'cash'];
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)] as T;

function monthOf(date: string) {
  return date.slice(0, 7);
}
function dateFor(month: string, day: number) {
  return `${month}-${String(day).padStart(2, '0')}`;
}

type HabitsState = {
  month: string; // YYYY-MM
  daysInMonth: number;
  habits: Habit[];
  loading: boolean;
  load: (month?: string) => Promise<void>;
  shiftMonth: (delta: number) => Promise<void>;
  toggle: (habitId: string, day: number) => Promise<void>;
  addHabit: (name: string) => Promise<void>;
  removeHabit: (habitId: string) => Promise<void>;
  fillDefaults: () => Promise<void>;
};

export const useHabitsStore = create<HabitsState>((set, get) => ({
  month: monthOf(toISODate()),
  daysInMonth: 31,
  habits: [],
  loading: false,

  load: async (month = get().month) => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;
    set({ loading: true, month });
    try {
      const data = await fetchHabitMonth(token, month);
      set({ habits: data.habits, daysInMonth: data.daysInMonth, month: data.month });
    } catch {
      // keep whatever we have
    } finally {
      set({ loading: false });
    }
  },

  shiftMonth: async (delta) => {
    const [y, m] = get().month.split('-').map(Number);
    const d = new Date(y!, m! - 1 + delta, 1);
    await get().load(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  },

  toggle: async (habitId, day) => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;
    const { month, habits } = get();
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    const done = habit.days.includes(day);
    const nextDays = done ? habit.days.filter((d) => d !== day) : [...habit.days, day].sort((a, b) => a - b);
    // Optimistic update.
    set({ habits: habits.map((h) => (h.id === habitId ? { ...h, days: nextDays } : h)) });
    try {
      await toggleHabit(token, habitId, dateFor(month, day), !done);
    } catch {
      void get().load(); // reconcile on failure
    }
  },

  addHabit: async (name) => {
    const token = useAuthStore.getState().accessToken;
    if (!token || !name.trim()) return;
    await apiCreateHabit(token, { name: name.trim(), color: pick(HABIT_COLORS), icon: pick(HABIT_ICONS), source: 'manual' });
    await get().load();
  },

  removeHabit: async (habitId) => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;
    set({ habits: get().habits.filter((h) => h.id !== habitId) });
    try {
      await apiDeleteHabit(token, habitId);
    } catch {
      void get().load();
    }
  },

  // One-tap "fill my usual day": seeds default meals/water/walk, then refreshes
  // both the habit grid and the affected screens.
  fillDefaults: async () => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;
    try {
      await addHabitDefaults(token, toISODate());
      await Promise.all([get().load(), refreshDomains(['meals', 'water', 'workout'])]);
    } catch {
      // best-effort
    }
  }
}));
