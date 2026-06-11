import { useMemo } from 'react';

import { useAuthStore } from '../store/auth';
import { useMealsStore } from '../store/meals';
import { toISODate } from '../utils/date';

export function useCalories(date = toISODate()) {
  const target = useAuthStore((state) => state.profile.calorieTarget);
  const calories = useMealsStore((state) => state.caloriesForDate(date));
  const protein = useMealsStore((state) => state.proteinForDate(date));

  return useMemo(
    () => ({
      target,
      calories,
      protein,
      remaining: Math.max(0, target - calories),
      progress: target ? (calories / target) * 100 : 0
    }),
    [calories, protein, target]
  );
}
