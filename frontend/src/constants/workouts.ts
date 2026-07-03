import { Exercise, Level, WeekDay, WorkoutFocus } from '../types';

const exercise = (name: string, homeAlt?: string, durationSec?: number): Exercise => ({
  name,
  sets: durationSec ? 1 : 3,
  reps: durationSec ? 1 : 12,
  durationSec,
  homeAlt
});

// The pickable workout focuses. Each is a ready-made session the user can choose
// for the day and then customize (add / remove exercises).
export const WORKOUT_FOCUSES: WorkoutFocus[] = ['Push', 'Pull', 'Legs', 'Shoulders & Core', 'Full Body', 'Cardio'];

export const WORKOUT_TEMPLATES: Record<WorkoutFocus, Exercise[]> = {
  Push: [
    exercise('Bench Press', 'Decline Pushups'),
    exercise('Pushups'),
    exercise('Chest Fly', 'Floor Fly'),
    exercise('Tricep Pushdown', 'Chair Dips')
  ],
  Pull: [
    exercise('Pullups', 'Towel Rows'),
    exercise('Barbell Row', 'Backpack Row'),
    exercise('Lat Pulldown', 'Band Pulldown'),
    exercise('Bicep Curl', 'Backpack Curl')
  ],
  Legs: [
    exercise('Squats', 'Bodyweight Squats'),
    exercise('Leg Press', 'Wall Sit'),
    exercise('Lunges'),
    exercise('Calf Raises')
  ],
  'Shoulders & Core': [
    exercise('Shoulder Press', 'Pike Pushups'),
    exercise('Lateral Raise', 'Water Bottle Raise'),
    exercise('Plank', undefined, 60),
    exercise('Crunches')
  ],
  'Full Body': [exercise('Full Body HIIT', undefined, 1200)],
  Cardio: [exercise('Running', undefined, 1800), exercise('Cycling', undefined, 1800), exercise('Stretching', undefined, 900)]
};

// The default focus suggested for each weekday (Sunday = rest).
export const WEEKDAY_FOCUS: Record<WeekDay, WorkoutFocus | null> = {
  monday: 'Push',
  tuesday: 'Pull',
  wednesday: 'Legs',
  thursday: 'Shoulders & Core',
  friday: 'Full Body',
  saturday: 'Cardio',
  sunday: null
};

// Weekly split derived from the focus templates — single source of truth.
export const WORKOUT_PLAN: Record<WeekDay, Exercise[]> = {
  monday: WORKOUT_TEMPLATES.Push,
  tuesday: WORKOUT_TEMPLATES.Pull,
  wednesday: WORKOUT_TEMPLATES.Legs,
  thursday: WORKOUT_TEMPLATES['Shoulders & Core'],
  friday: WORKOUT_TEMPLATES['Full Body'],
  saturday: WORKOUT_TEMPLATES.Cardio,
  sunday: []
};

// Every distinct exercise across all templates — the pool users add from.
export const EXERCISE_POOL: Exercise[] = WORKOUT_FOCUSES.flatMap((focus) => WORKOUT_TEMPLATES[focus]).filter(
  (ex, index, all) => all.findIndex((e) => e.name === ex.name) === index
);

// Name → Exercise lookup, so a saved/selected name resolves back to full metadata.
export const EXERCISE_BY_NAME: Record<string, Exercise> = Object.fromEntries(EXERCISE_POOL.map((e) => [e.name, e]));

export const LEVEL_MULTIPLIER: Record<Level, number> = {
  Beginner: 0.8,
  Intermediate: 1,
  Advanced: 1.25
};

// Scales an exercise's sets/reps/duration for the chosen intensity level.
export function scaleForLevel(item: Exercise, level: Level): Exercise {
  const multiplier = LEVEL_MULTIPLIER[level];
  return {
    ...item,
    sets: Math.max(1, Math.round(item.sets * multiplier)),
    reps: Math.max(1, Math.round(item.reps * multiplier)),
    durationSec: item.durationSec ? Math.round(item.durationSec * multiplier) : undefined
  };
}
