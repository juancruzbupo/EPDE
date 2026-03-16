-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "assignedToName" VARCHAR(200);

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "assignedToName" VARCHAR(200);
