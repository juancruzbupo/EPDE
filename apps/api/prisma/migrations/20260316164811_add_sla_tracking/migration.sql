-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "firstResponseAt" TIMESTAMP(3),
ADD COLUMN     "resolvedAt" TIMESTAMP(3);
