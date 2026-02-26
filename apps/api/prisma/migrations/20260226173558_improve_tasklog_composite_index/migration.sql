-- DropIndex
DROP INDEX "TaskLog_completedBy_idx";

-- CreateIndex
CREATE INDEX "TaskLog_completedBy_completedAt_idx" ON "TaskLog"("completedBy", "completedAt");
