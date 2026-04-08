-- AlterTable
ALTER TABLE "InspectionChecklist" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "InspectionItem" ADD COLUMN     "deletedAt" TIMESTAMP(3);
