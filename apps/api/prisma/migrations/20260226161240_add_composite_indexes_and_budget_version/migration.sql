-- AlterTable
ALTER TABLE "BudgetRequest" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Notification_userId_type_createdAt_idx" ON "Notification"("userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "Task_status_nextDueDate_idx" ON "Task"("status", "nextDueDate");

-- CreateIndex
CREATE INDEX "Task_status_deletedAt_idx" ON "Task"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "TaskLog_completedBy_idx" ON "TaskLog"("completedBy");

-- CreateIndex
CREATE INDEX "User_role_deletedAt_idx" ON "User"("role", "deletedAt");
