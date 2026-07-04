import { useEffect, useState } from 'react';

import { getRandomActionQuote } from '../constants/quotes';
import { useCalories } from '../hooks/useCalories';
import { useWater } from '../hooks/useWater';
import { useWorkout } from '../hooks/useWorkout';
import { showProgressNotification } from '../services/notifications';
import { useAuthStore } from '../store/auth';

const clampPct = (value: number) => Math.max(0, Math.min(100, value));

/**
 * Headless: renders nothing. Keeps the ongoing "today's progress" phone
 * notification in sync with the live stores — calories, water, workout and
 * streak — and rotates a strong motivational line. Mounted once inside the
 * authed app so it tracks the day even as the user logs things.
 */
export function ProgressNotifier() {
  const token = useAuthStore((state) => state.accessToken);
  const streak = useAuthStore((state) => state.streak);
  const calories = useCalories();
  const water = useWater();
  const workout = useWorkout();
  const [quote, setQuote] = useState(getRandomActionQuote);

  // Refresh the motivational line every 5 minutes so it stays fresh.
  useEffect(() => {
    const id = setInterval(() => setQuote(getRandomActionQuote()), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const workoutProgress = workout.total
    ? (workout.done / workout.total) * 100
    : workout.completedToday
      ? 100
      : 0;
  const overall = Math.round((clampPct(calories.progress) + clampPct(water.progress) + workoutProgress) / 3);
  const workoutLabel = workout.total
    ? `${workout.done}/${workout.total} done`
    : workout.completedToday
      ? 'Completed'
      : 'Rest day';

  useEffect(() => {
    if (!token) return; // only while signed in
    void showProgressNotification({
      overall,
      streak,
      caloriesConsumed: calories.calories,
      calorieTarget: calories.target,
      waterMl: water.intake,
      waterGoalMl: water.goal,
      workoutLabel,
      quote: quote.text
    });
  }, [
    token,
    overall,
    streak,
    calories.calories,
    calories.target,
    water.intake,
    water.goal,
    workoutLabel,
    quote.text
  ]);

  return null;
}
