-- CreateIndex
CREATE INDEX "CategoryTemplate_createdAt_idx" ON "CategoryTemplate"("createdAt");

-- CreateIndex
CREATE INDEX "MaintenancePlan_status_idx" ON "MaintenancePlan"("status");

-- CreateIndex
CREATE INDEX "MaintenancePlan_createdBy_idx" ON "MaintenancePlan"("createdBy");

-- CreateIndex
CREATE INDEX "TaskTemplate_categoryId_displayOrder_idx" ON "TaskTemplate"("categoryId", "displayOrder");
