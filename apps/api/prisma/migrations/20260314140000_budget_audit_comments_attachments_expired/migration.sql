-- AlterEnum
ALTER TYPE "BudgetStatus" ADD VALUE 'EXPIRED';

-- CreateTable
CREATE TABLE "BudgetAuditLog" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "before" JSONB NOT NULL,
    "after" JSONB NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetComment" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" VARCHAR(2000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetAttachment" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BudgetAuditLog_budgetId_changedAt_idx" ON "BudgetAuditLog"("budgetId", "changedAt");

-- CreateIndex
CREATE INDEX "BudgetAuditLog_userId_changedAt_idx" ON "BudgetAuditLog"("userId", "changedAt");

-- CreateIndex
CREATE INDEX "BudgetComment_budgetId_createdAt_idx" ON "BudgetComment"("budgetId", "createdAt");

-- CreateIndex
CREATE INDEX "BudgetAttachment_budgetId_idx" ON "BudgetAttachment"("budgetId");

-- AddForeignKey
ALTER TABLE "BudgetAuditLog" ADD CONSTRAINT "BudgetAuditLog_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "BudgetRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAuditLog" ADD CONSTRAINT "BudgetAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetComment" ADD CONSTRAINT "BudgetComment_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "BudgetRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetComment" ADD CONSTRAINT "BudgetComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAttachment" ADD CONSTRAINT "BudgetAttachment_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "BudgetRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
