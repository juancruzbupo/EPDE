-- DropForeignKey
ALTER TABLE "BudgetRequest" DROP CONSTRAINT "BudgetRequest_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceRequest" DROP CONSTRAINT "ServiceRequest_propertyId_fkey";

-- AlterTable
ALTER TABLE "BudgetRequest" ADD COLUMN     "createdBy" TEXT;

-- AlterTable
ALTER TABLE "MaintenancePlan" ADD COLUMN     "createdBy" TEXT;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "createdBy" TEXT;

-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "createdBy" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "createdBy" TEXT;

-- AddForeignKey
ALTER TABLE "BudgetRequest" ADD CONSTRAINT "BudgetRequest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
