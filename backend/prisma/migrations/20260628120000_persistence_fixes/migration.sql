-- Persistence fixes: one workout per day, server-side streak, AI alarms in DB.

-- ─── UserProfile: streak + last active date ──────────────────────────────────
ALTER TABLE "UserProfile" ADD COLUMN "streak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UserProfile" ADD COLUMN "lastActiveDate" TEXT NOT NULL DEFAULT '';

-- ─── WorkoutLog: collapse duplicates, then enforce one row per user/day ───────
ALTER TABLE "WorkoutLog" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Keep only the most recent log per (userId, date) before adding the unique index.
DELETE FROM "WorkoutLog"
WHERE "id" NOT IN (
  SELECT DISTINCT ON ("userId", "date") "id"
  FROM "WorkoutLog"
  ORDER BY "userId", "date", "createdAt" DESC
);

DROP INDEX "WorkoutLog_userId_date_idx";
CREATE UNIQUE INDEX "WorkoutLog_userId_date_key" ON "WorkoutLog"("userId", "date");

-- ─── MotivationAlarm ─────────────────────────────────────────────────────────
CREATE TABLE "MotivationAlarm" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alarmId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "hour" INTEGER NOT NULL,
    "minute" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MotivationAlarm_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MotivationAlarm_userId_alarmId_key" ON "MotivationAlarm"("userId", "alarmId");
CREATE INDEX "MotivationAlarm_userId_idx" ON "MotivationAlarm"("userId");

ALTER TABLE "MotivationAlarm" ADD CONSTRAINT "MotivationAlarm_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
