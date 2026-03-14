-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "taskId" TEXT;

-- CreateIndex
CREATE INDEX "ServiceRequest_taskId_idx" ON "ServiceRequest"("taskId");

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
