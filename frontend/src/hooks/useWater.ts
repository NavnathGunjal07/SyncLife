import { useMemo } from 'react';

import { useAuthStore } from '../store/auth';
import { useWaterStore } from '../store/water';
import { resolveWaterGoal } from '../utils/calculators';
import { toISODate } from '../utils/date';

export function useWater(date = toISODate()) {
  const profile = useAuthStore((state) => state.profile);
  const intake = useWaterStore((state) => state.totalForDate(date));
  const goal = resolveWaterGoal(profile);

  return useMemo(
    () => ({
      intake,
      goal,
      remaining: Math.max(0, goal - intake),
      progress: goal ? (intake / goal) * 100 : 0
    }),
    [goal, intake]
  );
}
