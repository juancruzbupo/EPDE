-- CreateTable
CREATE TABLE "FailedNotification" (
    "id" TEXT NOT NULL,
    "handler" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "lastError" VARCHAR(1000) NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FailedNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FailedNotification_resolvedAt_retryCount_nextRetryAt_idx" ON "FailedNotification"("resolvedAt", "retryCount", "nextRetryAt");
