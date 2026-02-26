-- DropForeignKey
ALTER TABLE "MaintenancePlan" DROP CONSTRAINT "MaintenancePlan_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_maintenancePlanId_fkey";

-- DropForeignKey
ALTER TABLE "TaskLog" DROP CONSTRAINT "TaskLog_taskId_fkey";

-- DropForeignKey
ALTER TABLE "TaskNote" DROP CONSTRAINT "TaskNote_taskId_fkey";

-- CreateIndex
CREATE INDEX "BudgetRequest_requestedBy_status_idx" ON "BudgetRequest"("requestedBy", "status");

-- CreateIndex
CREATE INDEX "BudgetRequest_status_createdAt_idx" ON "BudgetRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Property_userId_deletedAt_idx" ON "Property"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "ServiceRequest_requestedBy_status_idx" ON "ServiceRequest"("requestedBy", "status");

-- CreateIndex
CREATE INDEX "ServiceRequest_status_urgency_idx" ON "ServiceRequest"("status", "urgency");

-- CreateIndex
CREATE INDEX "Task_maintenancePlanId_status_idx" ON "Task"("maintenancePlanId", "status");

-- AddForeignKey
ALTER TABLE "MaintenancePlan" ADD CONSTRAINT "MaintenancePlan_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_maintenancePlanId_fkey" FOREIGN KEY ("maintenancePlanId") REFERENCES "MaintenancePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskLog" ADD CONSTRAINT "TaskLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskNote" ADD CONSTRAINT "TaskNote_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
