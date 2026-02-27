-- CreateIndex
CREATE INDEX "Task_nextDueDate_status_idx" ON "Task"("nextDueDate", "status");

-- CreateIndex
CREATE INDEX "Task_maintenancePlanId_deletedAt_status_idx" ON "Task"("maintenancePlanId", "deletedAt", "status");
