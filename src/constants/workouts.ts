import { Exercise, Level, WeekDay } from '../types';

const exercise = (name: string, homeAlt?: string, durationSec?: number): Exercise => ({
  name,
  sets: durationSec ? 1 : 3,
  reps: durationSec ? 1 : 12,
  durationSec,
  homeAlt
});

export const WORKOUT_PLAN: Record<WeekDay, Exercise[]> = {
  monday: [
    exercise('Bench Press', 'Decline Pushups'),
    exercise('Pushups'),
    exercise('Chest Fly', 'Floor Fly'),
    exercise('Tricep Pushdown', 'Chair Dips')
  ],
  tuesday: [
    exercise('Pullups', 'Towel Rows'),
    exercise('Barbell Row', 'Backpack Row'),
    exercise('Lat Pulldown', 'Band Pulldown'),
    exercise('Bicep Curl', 'Backpack Curl')
  ],
  wednesday: [
    exercise('Squats', 'Bodyweight Squats'),
    exercise('Leg Press', 'Wall Sit'),
    exercise('Lunges'),
    exercise('Calf Raises')
  ],
  thursday: [
    exercise('Shoulder Press', 'Pike Pushups'),
    exercise('Lateral Raise', 'Water Bottle Raise'),
    exercise('Plank', undefined, 60),
    exercise('Crunches')
  ],
  friday: [exercise('Full Body HIIT', undefined, 1200)],
  saturday: [exercise('Running', undefined, 1800), exercise('Cycling', undefined, 1800), exercise('Stretching', undefined, 900)],
  sunday: []
};

export const LEVEL_MULTIPLIER: Record<Level, number> = {
  Beginner: 0.8,
  Intermediate: 1,
  Advanced: 1.25
};
