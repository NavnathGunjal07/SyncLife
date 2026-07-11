import { prisma, createMealLog, createWaterLog, createWorkoutLog } from './dbService.js';

// ─── Defaults ─────────────────────────────────────────────────────────────────

// Seed habits for a brand-new user. `source` drives auto-completion:
//  water/meals/workout → derived from the logs the user already keeps
//  walking/sleep       → auto-marked done each day (a "minimal action" default)
//  manual              → the user taps it
const DEFAULT_HABITS = [
  { name: 'Water', color: '#38BDF8', icon: 'water', source: 'water' },
  { name: 'Meals', color: '#22C55E', icon: 'restaurant', source: 'meals' },
  { name: 'Workout', color: '#A78BFA', icon: 'barbell', source: 'workout' },
  { name: 'Walk', color: '#F59E0B', icon: 'walk', source: 'walking' },
  { name: 'Sleep 7h', color: '#FB7185', icon: 'moon', source: 'sleep' },
  { name: 'Meditate', color: '#2DD4BF', icon: 'leaf', source: 'manual' }
];

// Sources that get a default "done" mark seeded automatically each day.
const AUTO_SEED_SOURCES = ['walking', 'sleep'];

function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number);
  return new Date(y!, m!, 0).getDate();
}

function weekdayName(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }).toLowerCase();
}

export async function ensureDefaultHabits(userId: string) {
  const count = await prisma.habit.count({ where: { userId, archived: false } });
  if (count > 0) return;
  await prisma.habit.createMany({
    data: DEFAULT_HABITS.map((h, i) => ({ userId, ...h, sortOrder: i }))
  });
}

export function getHabits(userId: string) {
  return prisma.habit.findMany({
    where: { userId, archived: false },
    orderBy: { sortOrder: 'asc' }
  });
}

export async function createHabit(
  userId: string,
  input: { name: string; color: string; icon?: string; source?: string }
) {
  const sortOrder = await prisma.habit.count({ where: { userId } });
  return prisma.habit.create({
    data: {
      userId,
      name: input.name,
      color: input.color,
      icon: input.icon ?? 'checkbox-outline',
      source: input.source ?? 'manual',
      sortOrder
    }
  });
}

export async function archiveHabit(userId: string, habitId: string) {
  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
  if (!habit) return false;
  await prisma.habit.update({ where: { id: habitId }, data: { archived: true } });
  return true;
}

// Explicitly set (override) a habit's status for a day. Returns false if the
// habit isn't the caller's.
export async function setHabitLog(userId: string, habitId: string, date: string, done: boolean) {
  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
  if (!habit) return false;
  await prisma.habitLog.upsert({
    where: { habitId_date: { habitId, date } },
    update: { done, auto: false },
    create: { userId, habitId, date, done, auto: false }
  });
  return true;
}

// Auto-mark walking/sleep as done for `date` (only if the user hasn't set them).
async function seedDailyDefaults(userId: string, date: string) {
  const habits = await prisma.habit.findMany({
    where: { userId, archived: false, source: { in: AUTO_SEED_SOURCES } }
  });
  for (const habit of habits) {
    const existing = await prisma.habitLog.findUnique({ where: { habitId_date: { habitId: habit.id, date } } });
    if (!existing) {
      await prisma.habitLog.create({ data: { userId, habitId: habit.id, date, done: true, auto: true } });
    }
  }
}

// ─── Month view (with auto-derivation) ───────────────────────────────────────

export interface HabitMonthEntry {
  id: string;
  name: string;
  color: string;
  icon: string;
  source: string;
  days: number[]; // day-of-month numbers that are completed
}

export async function getHabitMonth(userId: string, month: string) {
  await ensureDefaultHabits(userId);
  const today = new Date().toISOString().slice(0, 10);
  if (today.startsWith(month)) await seedDailyDefaults(userId, today);

  const [habits, logs, waterLogs, mealRows, workoutRows, profile] = await Promise.all([
    getHabits(userId),
    prisma.habitLog.findMany({ where: { userId, date: { startsWith: month } } }),
    prisma.waterLog.findMany({ where: { userId, date: { startsWith: month } } }),
    prisma.mealLog.findMany({ where: { userId, date: { startsWith: month } }, select: { date: true } }),
    prisma.workoutLog.findMany({ where: { userId, date: { startsWith: month }, completed: true }, select: { date: true } }),
    prisma.userProfile.findUnique({ where: { userId } })
  ]);

  const override = new Map<string, boolean>();
  logs.forEach((l) => override.set(`${l.habitId}|${l.date}`, l.done));

  const waterByDate = new Map<string, number>();
  waterLogs.forEach((w) => waterByDate.set(w.date, (waterByDate.get(w.date) ?? 0) + w.amountMl));
  const mealDates = new Set(mealRows.map((m) => m.date));
  const workoutDates = new Set(workoutRows.map((w) => w.date));
  const waterGoal = profile?.waterGoalMl ?? 2310;

  const total = daysInMonth(month);
  const entries: HabitMonthEntry[] = habits.map((h) => {
    const days: number[] = [];
    for (let d = 1; d <= total; d++) {
      const date = `${month}-${String(d).padStart(2, '0')}`;
      const key = `${h.id}|${date}`;
      let done: boolean;
      if (override.has(key)) done = override.get(key)!;
      else if (h.source === 'water') done = (waterByDate.get(date) ?? 0) >= waterGoal;
      else if (h.source === 'meals') done = mealDates.has(date);
      else if (h.source === 'workout') done = workoutDates.has(date);
      else done = false;
      if (done) days.push(d);
    }
    return { id: h.id, name: h.name, color: h.color, icon: h.icon, source: h.source, days };
  });

  return { month, daysInMonth: total, habits: entries };
}

// ─── Year view (heatmap) ──────────────────────────────────────────────────────

export interface HabitYearEntry {
  id: string;
  name: string;
  color: string;
  icon: string;
  source: string;
  dates: string[]; // ISO dates (YYYY-MM-DD) completed in the year
}

// Same completion rules as the month view (explicit log overrides win, else
// derived from water/meal/workout data), but returned as full dates so the
// client can render a whole-year heatmap in one request.
export async function getHabitYear(userId: string, year: string) {
  await ensureDefaultHabits(userId);
  const today = new Date().toISOString().slice(0, 10);
  if (today.startsWith(year)) await seedDailyDefaults(userId, today);

  const [habits, logs, waterLogs, mealRows, workoutRows, profile] = await Promise.all([
    getHabits(userId),
    prisma.habitLog.findMany({ where: { userId, date: { startsWith: year } } }),
    prisma.waterLog.findMany({ where: { userId, date: { startsWith: year } } }),
    prisma.mealLog.findMany({ where: { userId, date: { startsWith: year } }, select: { date: true } }),
    prisma.workoutLog.findMany({ where: { userId, date: { startsWith: year }, completed: true }, select: { date: true } }),
    prisma.userProfile.findUnique({ where: { userId } })
  ]);

  const waterByDate = new Map<string, number>();
  waterLogs.forEach((w) => waterByDate.set(w.date, (waterByDate.get(w.date) ?? 0) + w.amountMl));
  const waterGoal = profile?.waterGoalMl ?? 2310;

  const entries: HabitYearEntry[] = habits.map((h) => {
    const done = new Set<string>();
    if (h.source === 'water') {
      waterByDate.forEach((ml, date) => {
        if (ml >= waterGoal) done.add(date);
      });
    } else if (h.source === 'meals') {
      mealRows.forEach((m) => done.add(m.date));
    } else if (h.source === 'workout') {
      workoutRows.forEach((w) => done.add(w.date));
    }
    for (const log of logs) {
      if (log.habitId !== h.id) continue;
      if (log.done) done.add(log.date);
      else done.delete(log.date);
    }
    return { id: h.id, name: h.name, color: h.color, icon: h.icon, source: h.source, dates: [...done].sort() };
  });

  return { year, habits: entries };
}

// ─── One-tap "fill my usual day" ──────────────────────────────────────────────

// Seeds default logs so today's data-backed habits (meals/water/workout) light
// up with a single action. Everything created is a normal, editable log.
export async function addTodayDefaults(userId: string, date: string) {
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  const added: string[] = [];

  const existingMeals = await prisma.mealLog.findMany({ where: { userId, date } });
  if (existingMeals.length === 0) {
    const nonveg = profile?.dietaryPreference === 'nonveg';
    const defaults = [
      { mealId: 'default-b', mealName: 'Poha', mealType: 'Breakfast', totalCalories: 250, totalProtein: 6 },
      { mealId: 'default-l', mealName: 'Dal Rice', mealType: 'Lunch', totalCalories: 450, totalProtein: 12 },
      nonveg
        ? { mealId: 'default-d', mealName: 'Chicken Curry + Rice', mealType: 'Dinner', totalCalories: 700, totalProtein: 40 }
        : { mealId: 'default-d', mealName: 'Paneer Curry + Roti', mealType: 'Dinner', totalCalories: 650, totalProtein: 28 }
    ];
    for (const m of defaults) {
      await createMealLog(userId, { ...m, quantity: 1, date });
    }
    added.push('meals');
  }

  const waterGoal = profile?.waterGoalMl ?? 2310;
  const waterSum = (await prisma.waterLog.findMany({ where: { userId, date } })).reduce((s, w) => s + w.amountMl, 0);
  if (waterSum < waterGoal) {
    await createWaterLog(userId, {
      date,
      time: '09:00',
      amountMl: waterGoal - waterSum,
      dailyTotalMl: waterGoal,
      goalMl: waterGoal
    });
    added.push('water');
  }

  const existingWorkout = await prisma.workoutLog.findMany({ where: { userId, date } });
  if (existingWorkout.length === 0) {
    await createWorkoutLog(userId, {
      date,
      day: weekdayName(date),
      exercises: ['Walking'],
      durationMin: 15,
      caloriesBurned: 55,
      completed: true
    });
    added.push('workout');
  }

  return { added };
}
