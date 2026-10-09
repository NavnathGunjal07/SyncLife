import { MEALS } from '../constants/meals';
import {
  EXERCISE_BY_NAME,
  WEEKDAY_FOCUS,
  WORKOUT_PLAN,
  WORKOUT_TEMPLATES,
  scaleForLevel
} from '../constants/workouts';
import { DayLogs, Exercise, Level, Meal, WorkoutFocus } from '../types';
import { getWeekDay } from './date';
import { totalWaterForDay } from './calculators';

// Approximate MET (metabolic equivalent) per movement, matched by substring.
// More specific keys come first.
const MET_VALUES: Record<string, number> = {
  'jump rope': 11,
  running: 9.8,
  burpee: 8,
  hiit: 8,
  'mountain climber': 8,
  'jumping jack': 7.7,
  cycling: 7.5,
  deadlift: 6,
  squat: 5,
  lunge: 5,
  plank: 3.3,
  stretch: 2.3,
  default: 5
};

const metFor = (name: string) => {
  const lower = name.toLowerCase();
  const key = Object.keys(MET_VALUES).find((metKey) => lower.includes(metKey));
  return MET_VALUES[key ?? 'default'] ?? 5;
};

export function suggestMeals(caloriesRemaining: number): Meal[] {
  return MEALS.filter((meal) => meal.calories <= caloriesRemaining).sort((a, b) => b.protein - a.protein);
}

export function getDailyWorkout(date: Date, level: Level): Exercise[] {
  return WORKOUT_PLAN[getWeekDay(date)].map((item) => scaleForLevel(item, level));
}

/** The focus suggested for `date` before the user overrides it. */
export function defaultFocusForDate(date: Date): WorkoutFocus | null {
  return WEEKDAY_FOCUS[getWeekDay(date)];
}

/**
 * Resolves the exercises for a session, honouring the user's chosen focus and any
 * custom add/remove selection, scaled to their level.
 * - `focus` null → fall back to the weekday's default focus.
 * - `selection` null → use the focus template as-is; otherwise use exactly those names.
 */
export function resolveExercises(opts: {
  focus: WorkoutFocus | null;
  selection: string[] | null;
  date: Date;
  level: Level;
}): Exercise[] {
  const { focus, selection, date, level } = opts;
  const effectiveFocus = focus ?? defaultFocusForDate(date);
  const names = selection ?? (effectiveFocus ? WORKOUT_TEMPLATES[effectiveFocus].map((e) => e.name) : []);
  return names
    .map((name) => EXERCISE_BY_NAME[name])
    .filter((ex): ex is Exercise => Boolean(ex))
    .map((ex) => scaleForLevel(ex, level));
}

export function generateDailySummary(logs: DayLogs): string {
  const caloriesIn = logs.meals.reduce((sum, meal) => sum + meal.totalCalories, 0);
  const burned = logs.workouts.reduce((sum, workout) => sum + workout.caloriesBurned, 0);
  const water = totalWaterForDay(logs.water);
  return `Today you consumed ${caloriesIn} kcal and burned ${burned} kcal. Net: ${caloriesIn - burned} kcal. Water: ${water}ml / ${logs.profile.waterGoalMl}ml. Streak: ${logs.streak} days.`;
}

export function estimateCaloriesBurned(exercises: string[], durationMin: number, weightKg: number): number {
  if (durationMin <= 0 || exercises.length === 0 || weightKg <= 0) {
    return 0;
  }

  const averageMet = exercises.reduce((sum, name) => sum + metFor(name), 0) / exercises.length;

  return Math.round(((averageMet * 3.5 * weightKg) / 200) * durationMin);
}

/**
 * Time-weighted calorie estimate: each exercise burns at its own MET for its
 * share of the session (timed moves by their duration, rep moves ~1.5 min per
 * set incl. rest), scaled so the shares add up to the actual `durationMin`.
 * A 30-min run inside a strength session no longer counts as "one of six".
 */
export function estimateWorkoutCalories(exercises: Exercise[], durationMin: number, weightKg: number): number {
  if (durationMin <= 0 || exercises.length === 0 || weightKg <= 0) {
    return 0;
  }
  const shares = exercises.map((ex) => (ex.durationSec ? ex.durationSec / 60 : ex.sets * 1.5));
  const planned = shares.reduce((sum, min) => sum + min, 0) || 1;
  const scale = durationMin / planned;
  const kcal = exercises.reduce(
    (sum, ex, i) => sum + ((metFor(ex.name) * 3.5 * weightKg) / 200) * (shares[i] ?? 0) * scale,
    0
  );
  return Math.round(kcal);
}
