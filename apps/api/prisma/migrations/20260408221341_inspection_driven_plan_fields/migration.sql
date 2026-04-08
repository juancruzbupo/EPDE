-- AlterTable
ALTER TABLE "InspectionItem" ADD COLUMN     "taskTemplateId" TEXT;

-- AlterTable
ALTER TABLE "MaintenancePlan" ADD COLUMN     "sourceInspectionId" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "inspectionFinding" VARCHAR(2000),
ADD COLUMN     "inspectionPhotoUrl" TEXT;

-- CreateIndex
CREATE INDEX "InspectionItem_taskTemplateId_idx" ON "InspectionItem"("taskTemplateId");
