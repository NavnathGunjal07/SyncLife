import { useMemo } from 'react';

import { useWorkoutStore } from '../store/workout';
import { defaultFocusForDate, resolveExercises } from '../utils/aiHelpers';

export function useWorkout() {
  const level = useWorkoutStore((state) => state.level);
  const mode = useWorkoutStore((state) => state.mode);
  const focus = useWorkoutStore((state) => state.focus);
  const selection = useWorkoutStore((state) => state.selection);
  const checked = useWorkoutStore((state) => state.checked);
  const completedToday = useWorkoutStore((state) => state.completedToday());

  // The focus actually being trained (chosen override, else the weekday default).
  const effectiveFocus = focus ?? defaultFocusForDate(new Date());
  const plan = useMemo(
    () => resolveExercises({ focus, selection, date: new Date(), level }),
    [focus, selection, level]
  );
  const customized = selection !== null;

  return {
    level,
    mode,
    focus,
    effectiveFocus,
    checked,
    plan,
    customized,
    completedToday,
    total: plan.length,
    done: checked.length
  };
}
