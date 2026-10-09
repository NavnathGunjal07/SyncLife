import { Prisma } from '@prisma/client';

import { prisma } from './dbService.js';

/**
 * Account deletion that keeps only non-identifying analytics.
 *
 * In ONE transaction:
 *  1. Aggregate the user's data into a single AnonymousUsageStat row — counts,
 *     enumerated preferences, a BMI bucket and month-level dates. No user id,
 *     username, name, free text (meal names, notes, chats, memories, habit names),
 *     money amounts, exact dates or exact body measurements are copied.
 *  2. Delete the User. Every other table cascades, so all personal data — profile,
 *     logs, finances, chats, memories, alarms, habits, reports — is erased.
 *
 * If anything fails, nothing is deleted and nothing is recorded.
 */
export async function deleteAccountKeepingAnonymousStats(userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId }, include: { profile: true } });
    if (!user) return;

    const where = { userId };
    const [
      mealLogs,
      workouts,
      waterLogs,
      transactions,
      goldEntries,
      habits,
      habitCompletions,
      coachMessagesSent,
      coachMemories,
      coachAlarms,
      completion,
      activeDays
    ] = await Promise.all([
      tx.mealLog.count({ where }),
      tx.workoutLog.findMany({ where, select: { completed: true, durationMin: true } }),
      tx.waterLog.count({ where }),
      tx.transaction.count({ where }),
      tx.goldEntry.count({ where }),
      tx.habit.count({ where }),
      tx.habitLog.count({ where: { userId, done: true } }),
      tx.chatMessage.count({ where: { userId, role: 'user' } }),
      tx.chatMemory.count({ where: { userId, status: 'saved' } }),
      tx.motivationAlarm.count({ where }),
      tx.dailySummary.aggregate({ where, _avg: { completionPercent: true } }),
      countActiveDays(tx, userId)
    ]);

    const profile = user.profile;
    await tx.anonymousUsageStat.create({
      data: {
        signupMonth: toMonth(user.createdAt),
        deletedMonth: toMonth(new Date()),
        activeDays,
        fitnessGoal: profile?.fitnessGoal ?? 'unknown',
        dietaryPreference: profile?.dietaryPreference ?? 'unknown',
        workoutMode: profile?.workoutMode ?? 'unknown',
        workoutLevel: profile?.workoutLevel ?? 'unknown',
        fastingPlan: profile?.fastingPlan ?? 'unknown',
        bmiBucket: bmiBucket(profile?.weightKg, profile?.heightCm),
        setupComplete: profile?.setupComplete ?? false,
        mealLogs,
        workoutLogs: workouts.length,
        workoutsCompleted: workouts.filter((w) => w.completed).length,
        workoutMinutes: Math.round(workouts.reduce((sum, w) => sum + (w.durationMin || 0), 0)),
        waterLogs,
        transactions,
        goldEntries,
        habits,
        habitCompletions,
        coachMessagesSent,
        coachMemories,
        coachAlarms,
        maxStreak: profile?.streak ?? 0,
        avgCompletionPercent:
          completion._avg.completionPercent == null ? null : Math.round(completion._avg.completionPercent)
      }
    });

    await tx.user.delete({ where: { id: userId } });
    // Default interactive-transaction timeout is 5s; heavy accounts on a cold
    // serverless DB connection can need longer.
  }, { timeout: 20000 });
}

/** Number of distinct days on which the user logged anything. */
async function countActiveDays(tx: Prisma.TransactionClient, userId: string): Promise<number> {
  const where = { userId };
  const select = { date: true } as const;
  const rows = await Promise.all([
    tx.mealLog.findMany({ where, select, distinct: ['date'] }),
    tx.workoutLog.findMany({ where, select, distinct: ['date'] }),
    tx.waterLog.findMany({ where, select, distinct: ['date'] }),
    tx.habitLog.findMany({ where, select, distinct: ['date'] }),
    tx.dailySummary.findMany({ where, select, distinct: ['date'] })
  ]);
  return new Set(rows.flat().map((r) => r.date)).size;
}

function toMonth(date: Date) {
  return date.toISOString().slice(0, 7);
}

/** WHO adult BMI categories — never the exact height/weight. */
function bmiBucket(weightKg?: number, heightCm?: number) {
  if (!weightKg || !heightCm) return 'unknown';
  const bmi = weightKg / (heightCm / 100) ** 2;
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}
