-- AI assistant chat: conversation persistence, long-term memory, setup/plan fields.

-- ─── UserProfile: onboarding + derived plan ──────────────────────────────────
ALTER TABLE "UserProfile" ADD COLUMN "setupComplete" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "UserProfile" ADD COLUMN "bmi" DOUBLE PRECISION;
ALTER TABLE "UserProfile" ADD COLUMN "sleepTime" TEXT;
ALTER TABLE "UserProfile" ADD COLUMN "gymTime" TEXT;
ALTER TABLE "UserProfile" ADD COLUMN "runningTime" TEXT;
ALTER TABLE "UserProfile" ADD COLUMN "fastingPlan" TEXT NOT NULL DEFAULT 'none';

-- ─── ChatMessage ─────────────────────────────────────────────────────────────
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'text',
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ChatMessage_userId_createdAt_idx" ON "ChatMessage"("userId", "createdAt");
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── ChatMemory ──────────────────────────────────────────────────────────────
CREATE TABLE "ChatMemory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'candidate',
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatMemory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ChatMemory_userId_content_key" ON "ChatMemory"("userId", "content");
CREATE INDEX "ChatMemory_userId_status_idx" ON "ChatMemory"("userId", "status");
ALTER TABLE "ChatMemory" ADD CONSTRAINT "ChatMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
