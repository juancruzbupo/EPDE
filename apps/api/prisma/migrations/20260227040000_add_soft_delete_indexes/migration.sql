-- CreateIndex
CREATE INDEX "BudgetRequest_propertyId_deletedAt_idx" ON "BudgetRequest"("propertyId", "deletedAt");

-- CreateIndex
CREATE INDEX "ServiceRequest_propertyId_deletedAt_idx" ON "ServiceRequest"("propertyId", "deletedAt");
