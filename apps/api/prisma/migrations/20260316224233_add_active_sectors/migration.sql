-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "activeSectors" "PropertySector"[] DEFAULT ARRAY['EXTERIOR', 'ROOF', 'TERRACE', 'INTERIOR', 'KITCHEN', 'BATHROOM', 'BASEMENT', 'GARDEN', 'INSTALLATIONS']::"PropertySector"[];
