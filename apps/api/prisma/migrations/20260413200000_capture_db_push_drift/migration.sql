-- This migration captures schema drift that accumulated in the dev database via `prisma db push`
-- without matching migration files. Applying it to a fresh database produces the same schema as
-- `schema.prisma`. On the dev database (where these objects already exist) it was registered via
-- `prisma migrate resolve --applied` without executing — the CREATE statements would have failed.

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isvGoal" INTEGER,
ADD COLUMN     "streakFreezeUsedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "UserMilestone" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "target" INTEGER NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserMilestone_userId_idx" ON "UserMilestone"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserMilestone_userId_type_key" ON "UserMilestone"("userId", "type");

-- CreateIndex
CREATE INDEX "WeeklyChallenge_userId_completed_idx" ON "WeeklyChallenge"("userId", "completed");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyChallenge_userId_weekStart_key" ON "WeeklyChallenge"("userId", "weekStart");

-- CreateIndex
CREATE INDEX "BudgetRequest_title_idx" ON "BudgetRequest" USING GIN ("title" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "ISVSnapshot_propertyId_snapshotDate_idx" ON "ISVSnapshot"("propertyId", "snapshotDate" DESC);

-- CreateIndex
CREATE INDEX "Property_address_idx" ON "Property" USING GIN ("address" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Property_city_idx" ON "Property" USING GIN ("city" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "ServiceRequest_title_idx" ON "ServiceRequest" USING GIN ("title" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "User_role_status_deletedAt_idx" ON "User"("role", "status", "deletedAt");

-- AddForeignKey
ALTER TABLE "UserMilestone" ADD CONSTRAINT "UserMilestone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyChallenge" ADD CONSTRAINT "WeeklyChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
