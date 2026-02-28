/*
  Warnings:

  - Added the required column `actionTaken` to the `TaskLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `conditionFound` to the `TaskLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `executor` to the `TaskLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `result` to the `TaskLog` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('INSPECTION', 'CLEANING', 'TEST', 'TREATMENT', 'SEALING', 'LUBRICATION', 'ADJUSTMENT', 'MEASUREMENT', 'EVALUATION');

-- CreateEnum
CREATE TYPE "ProfessionalRequirement" AS ENUM ('OWNER_CAN_DO', 'PROFESSIONAL_RECOMMENDED', 'PROFESSIONAL_REQUIRED');

-- CreateEnum
CREATE TYPE "TaskResult" AS ENUM ('OK', 'OK_WITH_OBSERVATIONS', 'NEEDS_ATTENTION', 'NEEDS_REPAIR', 'NEEDS_URGENT_REPAIR', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "ConditionFound" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TaskExecutor" AS ENUM ('OWNER', 'HIRED_PROFESSIONAL', 'EPDE_PROFESSIONAL');

-- CreateEnum
CREATE TYPE "ActionTaken" AS ENUM ('INSPECTION_ONLY', 'CLEANING', 'MINOR_REPAIR', 'MAJOR_REPAIR', 'REPLACEMENT', 'TREATMENT', 'SEALING', 'ADJUSTMENT', 'FULL_SERVICE', 'NO_ACTION');

-- AlterEnum
ALTER TYPE "RecurrenceType" ADD VALUE 'ON_DETECTION';

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "estimatedDurationMinutes" INTEGER,
ADD COLUMN     "professionalRequirement" "ProfessionalRequirement" NOT NULL DEFAULT 'OWNER_CAN_DO',
ADD COLUMN     "taskType" "TaskType" NOT NULL DEFAULT 'INSPECTION',
ADD COLUMN     "technicalDescription" VARCHAR(1000),
ALTER COLUMN "nextDueDate" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TaskLog" ADD COLUMN     "actionTaken" "ActionTaken" NOT NULL,
ADD COLUMN     "conditionFound" "ConditionFound" NOT NULL,
ADD COLUMN     "cost" DECIMAL(12,2),
ADD COLUMN     "executor" "TaskExecutor" NOT NULL,
ADD COLUMN     "result" "TaskResult" NOT NULL;

-- CreateTable
CREATE TABLE "CategoryTemplate" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(10),
    "description" VARCHAR(500),
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskTemplate" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "taskType" "TaskType" NOT NULL,
    "professionalRequirement" "ProfessionalRequirement" NOT NULL DEFAULT 'OWNER_CAN_DO',
    "technicalDescription" VARCHAR(1000),
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "recurrenceType" "RecurrenceType" NOT NULL,
    "recurrenceMonths" INTEGER NOT NULL DEFAULT 12,
    "estimatedDurationMinutes" INTEGER,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskTemplate_categoryId_idx" ON "TaskTemplate"("categoryId");

-- CreateIndex
CREATE INDEX "Category_deletedAt_idx" ON "Category"("deletedAt");

-- AddForeignKey
ALTER TABLE "TaskTemplate" ADD CONSTRAINT "TaskTemplate_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CategoryTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
