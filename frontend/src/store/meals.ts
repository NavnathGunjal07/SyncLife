import { create } from 'zustand';

import { MEALS } from '../constants/meals';
import { appendMealLog } from '../services/googleSheets';
import { mergeDayLogs } from '../services/localCache';
import { Meal, MealLog } from '../types';
import { toISODate } from '../utils/date';
import { useAuthStore } from './auth';

type MealsState = {
  logs: MealLog[];
  addMeal: (meal: Meal, quantity: number) => Promise<void>;
  caloriesForDate: (date?: string) => number;
  proteinForDate: (date?: string) => number;
  setLogs: (logs: MealLog[]) => void;
};

export const useMealsStore = create<MealsState>((set, get) => ({
  logs: [],
  setLogs: (logs) => set({ logs }),
  addMeal: async (meal, quantity) => {
    const log: MealLog = {
      mealId: meal.id,
      quantity,
      date: toISODate(),
      totalCalories: Math.round(meal.calories * quantity),
      totalProtein: Math.round(meal.protein * quantity)
    };
    const logs = [...get().logs, log];
    set({ logs });
    await mergeDayLogs(log.date, { meals: logs.filter((item) => item.date === log.date) });
    const token = useAuthStore.getState().accessToken;
    if (token) {
      await appendMealLog(token, log);
    }
  },
  caloriesForDate: (date = toISODate()) =>
    get()
      .logs.filter((log) => log.date === date)
      .reduce((sum, log) => sum + log.totalCalories, 0),
  proteinForDate: (date = toISODate()) =>
    get()
      .logs.filter((log) => log.date === date)
      .reduce((sum, log) => sum + log.totalProtein, 0)
}));

export const getMealById = (id: string) => MEALS.find((meal) => meal.id === id);
