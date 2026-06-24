import { PrismaClient } from '@prisma/client';

// Reuse a single PrismaClient across serverless invocations (and local hot
// reloads) to avoid exhausting database connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MealLogInput {
  mealId: string;
  mealName?: string;
  mealType?: string;
  quantity: number;
  date: string;
  totalCalories: number;
  totalProtein: number;
}

export interface WorkoutLogInput {
  date: string;
  day: string;
  exercises: string[];
  durationMin: number;
  caloriesBurned: number;
  completed: boolean;
}

export interface WaterLogInput {
  date: string;
  time: string;
  amountMl: number;
  dailyTotalMl?: number;
  goalMl?: number;
}

export interface TransactionInput {
  id: string;
  type: string;
  category: string;
  amount: number;
  notes: string;
  date: string;
}

export interface GoldEntryInput {
  id: string;
  category: string;
  grams: number;
  buyPrice: number;
  date: string;
}

export interface DailySummaryInput {
  date: string;
  caloriesConsumed: number;
  caloriesBurned: number;
  netCalories: number;
  waterMl: number;
  waterGoalMl: number;
  spend: number;
  workoutCompleted: boolean;
  streak: number;
  completionPercent: number;
}

export interface ProfileInput {
  weightKg: number;
  heightCm: number;
  fitnessGoal: string;
  calorieTarget: number;
  waterGoalMl: number;
  waterGoalMode: string;
  monthlyBudget: number;
}

// ─── Meal Logs ────────────────────────────────────────────────────────────────

export function createMealLog(userId: string, log: MealLogInput) {
  return prisma.mealLog.create({
    data: {
      userId,
      mealId: log.mealId,
      mealName: log.mealName ?? '',
      mealType: log.mealType ?? '',
      quantity: log.quantity,
      date: log.date,
      totalCalories: log.totalCalories,
      totalProtein: log.totalProtein
    }
  });
}

export function getMealLogsForDate(userId: string, date: string) {
  return prisma.mealLog.findMany({ where: { userId, date }, orderBy: { createdAt: 'asc' } });
}

// ─── Workout Logs ─────────────────────────────────────────────────────────────

export function createWorkoutLog(userId: string, log: WorkoutLogInput) {
  return prisma.workoutLog.create({
    data: {
      userId,
      date: log.date,
      day: log.day,
      exercises: JSON.stringify(log.exercises),
      durationMin: log.durationMin,
      caloriesBurned: log.caloriesBurned,
      completed: log.completed
    }
  });
}

export function getWorkoutLogsForDate(userId: string, date: string) {
  return prisma.workoutLog.findMany({ where: { userId, date }, orderBy: { createdAt: 'asc' } });
}

// ─── Water Logs ───────────────────────────────────────────────────────────────

export function createWaterLog(userId: string, log: WaterLogInput) {
  return prisma.waterLog.create({
    data: {
      userId,
      date: log.date,
      time: log.time,
      amountMl: log.amountMl,
      dailyTotalMl: log.dailyTotalMl,
      goalMl: log.goalMl
    }
  });
}

export function getWaterLogsForDate(userId: string, date: string) {
  return prisma.waterLog.findMany({ where: { userId, date }, orderBy: { createdAt: 'asc' } });
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export function createTransaction(userId: string, tx: TransactionInput) {
  return prisma.transaction.create({
    data: {
      userId,
      txId: tx.id,
      type: tx.type,
      category: tx.category,
      amount: tx.amount,
      notes: tx.notes,
      date: tx.date
    }
  });
}

export function getTransactionsForMonth(userId: string, year: string, month: string) {
  const prefix = `${year}-${month.padStart(2, '0')}`;
  return prisma.transaction.findMany({
    where: { userId, date: { startsWith: prefix } },
    orderBy: { createdAt: 'asc' }
  });
}

export function getAllTransactions(userId: string) {
  return prisma.transaction.findMany({ where: { userId }, orderBy: { date: 'desc' } });
}

// ─── Gold Entries ─────────────────────────────────────────────────────────────

export function createGoldEntry(userId: string, entry: GoldEntryInput) {
  return prisma.goldEntry.create({
    data: {
      userId,
      entryId: entry.id,
      category: entry.category,
      grams: entry.grams,
      buyPrice: entry.buyPrice,
      date: entry.date
    }
  });
}

export function getAllGoldEntries(userId: string) {
  return prisma.goldEntry.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
}

// ─── Daily Summary ────────────────────────────────────────────────────────────

export function upsertDailySummary(userId: string, summary: DailySummaryInput) {
  return prisma.dailySummary.upsert({
    where: { userId_date: { userId, date: summary.date } },
    update: {
      caloriesConsumed: summary.caloriesConsumed,
      caloriesBurned: summary.caloriesBurned,
      netCalories: summary.netCalories,
      waterMl: summary.waterMl,
      waterGoalMl: summary.waterGoalMl,
      spend: summary.spend,
      workoutCompleted: summary.workoutCompleted,
      streak: summary.streak,
      completionPercent: summary.completionPercent
    },
    create: {
      userId,
      date: summary.date,
      caloriesConsumed: summary.caloriesConsumed,
      caloriesBurned: summary.caloriesBurned,
      netCalories: summary.netCalories,
      waterMl: summary.waterMl,
      waterGoalMl: summary.waterGoalMl,
      spend: summary.spend,
      workoutCompleted: summary.workoutCompleted,
      streak: summary.streak,
      completionPercent: summary.completionPercent
    }
  });
}

export function getDailySummary(userId: string, date: string) {
  return prisma.dailySummary.findUnique({ where: { userId_date: { userId, date } } });
}

// ─── User Profile / Goals ─────────────────────────────────────────────────────

export function upsertUserProfile(userId: string, profile: ProfileInput) {
  return prisma.userProfile.upsert({
    where: { userId },
    update: {
      weightKg: profile.weightKg,
      heightCm: profile.heightCm,
      fitnessGoal: profile.fitnessGoal,
      calorieTarget: profile.calorieTarget,
      waterGoalMl: profile.waterGoalMl,
      waterGoalMode: profile.waterGoalMode,
      monthlyBudget: profile.monthlyBudget
    },
    create: {
      userId,
      weightKg: profile.weightKg,
      heightCm: profile.heightCm,
      fitnessGoal: profile.fitnessGoal,
      calorieTarget: profile.calorieTarget,
      waterGoalMl: profile.waterGoalMl,
      waterGoalMode: profile.waterGoalMode,
      monthlyBudget: profile.monthlyBudget
    }
  });
}

export function getUserProfile(userId: string) {
  return prisma.userProfile.findUnique({ where: { userId } });
}
