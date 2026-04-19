-- AlterTable
ALTER TABLE "MaintenancePlan" ADD COLUMN     "priceAmount" DECIMAL(12,2),
ADD COLUMN     "priceTier" "InspectionPriceTier";

-- CreateIndex
CREATE INDEX "MaintenancePlan_priceTier_createdAt_idx" ON "MaintenancePlan"("priceTier", "createdAt");
