-- CreateEnum
CREATE TYPE "PropertySector" AS ENUM ('EXTERIOR', 'ROOF', 'TERRACE', 'INTERIOR', 'KITCHEN', 'BATHROOM', 'BASEMENT', 'GARDEN', 'INSTALLATIONS');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "sector" "PropertySector";

-- CreateIndex
CREATE INDEX "Task_sector_idx" ON "Task"("sector");

-- CreateIndex
CREATE INDEX "Task_maintenancePlanId_sector_idx" ON "Task"("maintenancePlanId", "sector");
