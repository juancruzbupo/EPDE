-- CreateTable
CREATE TABLE "LandingSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "LandingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LandingSettings_key_key" ON "LandingSettings"("key");

-- CreateIndex
CREATE INDEX "BudgetRequest_status_deletedAt_idx" ON "BudgetRequest"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "ServiceRequest_status_deletedAt_idx" ON "ServiceRequest"("status", "deletedAt");
