import { useMemo } from 'react';

import { useWorkoutStore } from '../store/workout';
import { getDailyWorkout } from '../utils/aiHelpers';

export function useWorkout() {
  const level = useWorkoutStore((state) => state.level);
  const mode = useWorkoutStore((state) => state.mode);
  const checked = useWorkoutStore((state) => state.checked);
  const completedToday = useWorkoutStore((state) => state.completedToday());
  const plan = useMemo(() => getDailyWorkout(new Date(), level), [level]);

  return {
    level,
    mode,
    checked,
    plan,
    completedToday,
    total: plan.length,
    done: checked.length
  };
}
