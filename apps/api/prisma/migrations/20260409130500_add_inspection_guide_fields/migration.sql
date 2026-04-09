-- AlterTable
ALTER TABLE "InspectionItem" ADD COLUMN     "guideImageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "inspectionGuide" TEXT;

-- AlterTable
ALTER TABLE "TaskTemplate" ADD COLUMN     "guideImageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "inspectionGuide" TEXT;
