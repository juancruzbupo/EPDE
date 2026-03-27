-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activatedAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "User_status_subscriptionExpiresAt_idx" ON "User"("status", "subscriptionExpiresAt");
