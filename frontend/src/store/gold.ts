import { create } from 'zustand';

import { appendGoldEntry } from '../services/googleSheets';
import { mergeDayLogs } from '../services/localCache';
import { GoldCategory, GoldEntry } from '../types';
import { calculateGoldHoldings } from '../utils/calculators';
import { makeId, toISODate } from '../utils/date';
import { useAuthStore } from './auth';

type GoldState = {
  entries: GoldEntry[];
  addGoldEntry: (input: { category: GoldCategory; grams: number; buyPrice: number }) => Promise<void>;
  holdings: () => ReturnType<typeof calculateGoldHoldings>;
  setEntries: (entries: GoldEntry[]) => void;
};

export const useGoldStore = create<GoldState>((set, get) => ({
  entries: [],
  setEntries: (entries) => set({ entries }),
  addGoldEntry: async (input) => {
    const entry: GoldEntry = { id: makeId('gold'), date: toISODate(), ...input };
    const entries = [...get().entries, entry];
    set({ entries });
    await mergeDayLogs(entry.date, { gold: entries.filter((item) => item.date === entry.date) });
    const token = useAuthStore.getState().accessToken;
    if (token) {
      await appendGoldEntry(token, entry);
    }
  },
  holdings: () => calculateGoldHoldings(get().entries)
}));
