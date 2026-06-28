import { create } from 'zustand';

import { appendTransaction } from '../services/googleSheets';
import { mergeDayLogs } from '../services/localCache';
import { Transaction, TransactionType } from '../types';
import { makeId, toISODate } from '../utils/date';
import { useAuthStore } from './auth';

type FinanceState = {
  transactions: Transaction[];
  addTransaction: (input: { type: TransactionType; category: string; amount: number; notes: string }) => Promise<void>;
  totalForDate: (type: TransactionType, date?: string) => number;
  monthlyTotal: (type: TransactionType) => number;
  setTransactions: (transactions: Transaction[]) => void;
};

export const useFinanceStore = create<FinanceState>((set, get) => ({
  transactions: [],
  setTransactions: (transactions) => set({ transactions }),
  addTransaction: async (input) => {
    const tx: Transaction = { id: makeId('tx'), date: toISODate(), ...input };
    const transactions = [...get().transactions, tx];
    set({ transactions });
    await mergeDayLogs(tx.date, { transactions: transactions.filter((item) => item.date === tx.date) });
    const token = useAuthStore.getState().accessToken;
    if (token) {
      await appendTransaction(token, tx);
    }
  },
  totalForDate: (type, date = toISODate()) =>
    get()
      .transactions.filter((tx) => tx.type === type && tx.date === date)
      .reduce((sum, tx) => sum + tx.amount, 0),
  monthlyTotal: (type) => {
    const month = toISODate().slice(0, 7);
    return get()
      .transactions.filter((tx) => tx.type === type && tx.date.startsWith(month))
      .reduce((sum, tx) => sum + tx.amount, 0);
  }
}));
