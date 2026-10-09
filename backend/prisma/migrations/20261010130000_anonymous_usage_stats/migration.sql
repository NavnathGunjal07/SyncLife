-- Non-identifying aggregates retained after account deletion.

CREATE TABLE "AnonymousUsageStat" (
    "id" TEXT NOT NULL,
    "signupMonth" TEXT NOT NULL,
    "deletedMonth" TEXT NOT NULL,
    "activeDays" INTEGER NOT NULL,
    "fitnessGoal" TEXT NOT NULL,
    "dietaryPreference" TEXT NOT NULL,
    "workoutMode" TEXT NOT NULL,
    "workoutLevel" TEXT NOT NULL,
    "fastingPlan" TEXT NOT NULL,
    "bmiBucket" TEXT NOT NULL,
    "setupComplete" BOOLEAN NOT NULL,
    "mealLogs" INTEGER NOT NULL,
    "workoutLogs" INTEGER NOT NULL,
    "workoutsCompleted" INTEGER NOT NULL,
    "workoutMinutes" INTEGER NOT NULL,
    "waterLogs" INTEGER NOT NULL,
    "transactions" INTEGER NOT NULL,
    "goldEntries" INTEGER NOT NULL,
    "habits" INTEGER NOT NULL,
    "habitCompletions" INTEGER NOT NULL,
    "coachMessagesSent" INTEGER NOT NULL,
    "coachMemories" INTEGER NOT NULL,
    "coachAlarms" INTEGER NOT NULL,
    "maxStreak" INTEGER NOT NULL,
    "avgCompletionPercent" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnonymousUsageStat_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AnonymousUsageStat_deletedMonth_idx" ON "AnonymousUsageStat"("deletedMonth");
