-- CreateEnum
CREATE TYPE "InspectionChecklistStatus" AS ENUM ('DRAFT', 'COMPLETED');

-- AlterTable
ALTER TABLE "InspectionChecklist"
  ADD COLUMN "status" "InspectionChecklistStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "completedAt" TIMESTAMP(3);

-- Backfill: any checklist whose property already has a MaintenancePlan is considered
-- COMPLETED because the plan was generated from it. completedAt uses the plan's
-- createdAt as the best available proxy for when the checklist was locked.
UPDATE "InspectionChecklist" ic
SET "status" = 'COMPLETED',
    "completedAt" = mp."createdAt"
FROM "MaintenancePlan" mp
WHERE mp."sourceInspectionId" = ic."id";
