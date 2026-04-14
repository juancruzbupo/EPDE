-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'CONVERTED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "convertedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "referralCode" VARCHAR(20),
ADD COLUMN     "referralCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "referralCreditAnnualDiagnosis" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "referralCreditBiannualDiagnosis" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "referralCreditMonths" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "referredByCode" VARCHAR(20);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredUserId" TEXT,
    "referredEmail" VARCHAR(254),
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Referral_referrerId_status_idx" ON "Referral"("referrerId", "status");

-- CreateIndex
CREATE INDEX "Referral_referredUserId_idx" ON "Referral"("referredUserId");

-- CreateIndex
CREATE INDEX "Referral_status_idx" ON "Referral"("status");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

