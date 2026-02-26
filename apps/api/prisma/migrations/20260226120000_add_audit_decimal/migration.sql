-- AlterTable
ALTER TABLE "BudgetLineItem" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(12,4),
ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(14,2);

-- AlterTable
ALTER TABLE "BudgetRequest" ADD COLUMN     "updatedBy" TEXT;

-- AlterTable
ALTER TABLE "BudgetResponse" ALTER COLUMN "totalAmount" SET DATA TYPE DECIMAL(14,2);

-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "updatedBy" TEXT;
