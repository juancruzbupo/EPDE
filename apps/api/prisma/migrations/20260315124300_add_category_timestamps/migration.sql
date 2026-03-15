-- AlterTable: Add audit timestamps to Category (previously missing, unlike other entities)
-- Backfill existing rows with CURRENT_TIMESTAMP before adding NOT NULL constraint.
ALTER TABLE "Category" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Category" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
