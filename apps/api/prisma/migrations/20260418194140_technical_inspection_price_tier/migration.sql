-- CreateEnum
CREATE TYPE "InspectionPriceTier" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- AlterTable
ALTER TABLE "TechnicalInspection" ADD COLUMN     "priceTier" "InspectionPriceTier" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "propertySqm" DOUBLE PRECISION;
