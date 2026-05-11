import { create } from 'zustand';

import { appendWaterLog } from '../services/googleSheets';
import { mergeDayLogs } from '../services/localCache';
import { WaterLog } from '../types';
import { resolveWaterGoal } from '../utils/calculators';
import { toISODate, toTime } from '../utils/date';
import { useAuthStore } from './auth';

type WaterState = {
  logs: WaterLog[];
  addWater: (amountMl: number) => Promise<void>;
  totalForDate: (date?: string) => number;
};

export const useWaterStore = create<WaterState>((set, get) => ({
  logs: [],
  addWater: async (amountMl) => {
    const date = toISODate();
    const profile = useAuthStore.getState().profile;
    const dailyTotalMl =
      get()
        .logs.filter((item) => item.date === date)
        .reduce((sum, item) => sum + item.amountMl, 0) + amountMl;
    const log: WaterLog = { date, time: toTime(), amountMl, dailyTotalMl, goalMl: resolveWaterGoal(profile) };
    const logs = [...get().logs, log];
    set({ logs });
    await mergeDayLogs(log.date, { water: logs.filter((item) => item.date === log.date) });
    const token = useAuthStore.getState().accessToken;
    if (token) {
      await appendWaterLog(token, log);
    }
  },
  totalForDate: (date = toISODate()) =>
    get()
      .logs.filter((log) => log.date === date)
      .reduce((sum, log) => sum + log.amountMl, 0)
}));
