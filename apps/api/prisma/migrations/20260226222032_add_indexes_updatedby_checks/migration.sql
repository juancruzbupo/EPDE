-- AlterTable
ALTER TABLE "MaintenancePlan" ADD COLUMN     "updatedBy" TEXT;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "updatedBy" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "updatedBy" TEXT;

-- CreateIndex
CREATE INDEX "BudgetLineItem_budgetRequestId_idx" ON "BudgetLineItem"("budgetRequestId");

-- CreateIndex
CREATE INDEX "ServiceRequestPhoto_serviceRequestId_idx" ON "ServiceRequestPhoto"("serviceRequestId");

-- CreateIndex
CREATE INDEX "TaskNote_authorId_idx" ON "TaskNote"("authorId");

-- AddCheckConstraints
ALTER TABLE "BudgetLineItem"
ADD CONSTRAINT "check_quantity_positive" CHECK ("quantity" > 0);

ALTER TABLE "BudgetLineItem"
ADD CONSTRAINT "check_unit_price_positive" CHECK ("unitPrice" >= 0);

ALTER TABLE "BudgetResponse"
ADD CONSTRAINT "check_estimated_days_positive" CHECK ("estimatedDays" > 0);
