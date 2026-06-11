import { MOCK_GOLD_PRICE_PER_GRAM } from '../constants/finance';
import { GoldEntry, GoldHolding, UserProfile, WaterLog } from '../types';

export const waterGoalForWeight = (weightKg: number) => Math.round(weightKg * 35);

export const resolveWaterGoal = (profile: UserProfile) =>
  profile.waterGoalMode === 'auto' ? waterGoalForWeight(profile.weightKg) : profile.waterGoalMl;

export const totalWaterForDay = (logs: WaterLog[]) => logs.reduce((sum, log) => sum + log.amountMl, 0);

export const calculateGoldHoldings = (entries: GoldEntry[]): GoldHolding[] => {
  const grouped = entries.reduce<Record<string, GoldEntry[]>>((acc, entry) => {
    acc[entry.category] = [...(acc[entry.category] ?? []), entry];
    return acc;
  }, {});

  return Object.entries(grouped).map(([category, items]) => {
    const totalGrams = items.reduce((sum, item) => sum + item.grams, 0);
    const totalCost = items.reduce((sum, item) => sum + item.grams * item.buyPrice, 0);
    const currentValue = totalGrams * MOCK_GOLD_PRICE_PER_GRAM;
    return {
      category: category as GoldHolding['category'],
      totalGrams,
      avgBuyPrice: totalGrams ? totalCost / totalGrams : 0,
      currentValue,
      pnl: currentValue - totalCost
    };
  });
};
