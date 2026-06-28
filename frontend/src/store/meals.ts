import Toast from 'react-native-toast-message';
import { create } from 'zustand';

import { MEALS } from '../constants/meals';
import { postMealLog } from '../services/api';
import { appendMealLog } from '../services/googleSheets';
import { mergeDayLogs } from '../services/localCache';
import { Meal, MealLog } from '../types';
import { makeId, toISODate } from '../utils/date';
import { useAuthStore } from './auth';

export interface CustomMealInput {
  name: string;
  mealType: string;
  calories: number;
  protein: number;
  quantity: number;
}

type MealsState = {
  logs: MealLog[];
  addMeal: (meal: Meal, quantity: number) => Promise<void>;
  addCustomMeal: (input: CustomMealInput) => Promise<void>;
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
  // Logs a free-text / AI-parsed meal that isn't in the fixed catalog. The name
  // and type are carried explicitly (catalog lookup wouldn't find them).
  addCustomMeal: async ({ name, mealType, calories, protein, quantity }) => {
    const log: MealLog = {
      mealId: makeId('cmeal'),
      quantity,
      date: toISODate(),
      totalCalories: Math.round(calories),
      totalProtein: Math.round(protein)
    };
    const logs = [...get().logs, log];
    set({ logs });
    await mergeDayLogs(log.date, { meals: logs.filter((item) => item.date === log.date) });
    const token = useAuthStore.getState().accessToken;
    if (token) {
      try {
        await postMealLog(token, { ...log, mealName: name, mealType });
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Meal sync failed',
          text2: error instanceof Error ? error.message : 'Saved locally, will retry.'
        });
      }
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
