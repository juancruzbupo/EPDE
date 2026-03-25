-- DropIndex
DROP INDEX "Task_nextDueDate_idx";

-- DropIndex
DROP INDEX "Task_status_idx";

-- CreateIndex
CREATE INDEX "BudgetResponse_respondedAt_idx" ON "BudgetResponse"("respondedAt");

-- CreateIndex
CREATE INDEX "Notification_type_createdAt_idx" ON "Notification"("type", "createdAt");

-- CreateIndex
CREATE INDEX "TaskLog_taskId_completedAt_idx" ON "TaskLog"("taskId", "completedAt");

-- CreateIndex
CREATE INDEX "TaskLog_completedAt_idx" ON "TaskLog"("completedAt");

-- CreateIndex
CREATE INDEX "TaskLog_conditionFound_taskId_idx" ON "TaskLog"("conditionFound", "taskId");

-- CreateIndex
CREATE INDEX "TaskLog_cost_completedAt_idx" ON "TaskLog"("cost", "completedAt");
