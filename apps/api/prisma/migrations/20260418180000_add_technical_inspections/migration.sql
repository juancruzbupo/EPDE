-- Technical Inspections — paid professional service (ADR-019)

-- CreateEnum
CREATE TYPE "TechnicalInspectionType" AS ENUM ('BASIC', 'STRUCTURAL', 'SALE');
CREATE TYPE "TechnicalInspectionStatus" AS ENUM ('REQUESTED', 'SCHEDULED', 'IN_PROGRESS', 'REPORT_READY', 'PAID', 'CANCELED');
CREATE TYPE "TechnicalInspectionPaymentStatus" AS ENUM ('PENDING', 'PAID', 'CANCELED');

-- CreateTable TechnicalInspection
CREATE TABLE "TechnicalInspection" (
    "id" TEXT NOT NULL,
    "inspectionNumber" VARCHAR(20) NOT NULL,
    "propertyId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "type" "TechnicalInspectionType" NOT NULL,
    "status" "TechnicalInspectionStatus" NOT NULL DEFAULT 'REQUESTED',
    "clientNotes" VARCHAR(2000),
    "adminNotes" VARCHAR(4000),
    "scheduledFor" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "deliverableUrl" TEXT,
    "deliverableFileName" VARCHAR(200),
    "feeAmount" DECIMAL(12,2) NOT NULL,
    "feeStatus" "TechnicalInspectionPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "hadActivePlan" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "paymentMethod" VARCHAR(50),
    "paymentReceiptUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "TechnicalInspection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TechnicalInspection_inspectionNumber_key" ON "TechnicalInspection"("inspectionNumber");
CREATE INDEX "TechnicalInspection_propertyId_idx" ON "TechnicalInspection"("propertyId");
CREATE INDEX "TechnicalInspection_requestedBy_idx" ON "TechnicalInspection"("requestedBy");
CREATE INDEX "TechnicalInspection_status_idx" ON "TechnicalInspection"("status");
CREATE INDEX "TechnicalInspection_deletedAt_idx" ON "TechnicalInspection"("deletedAt");
CREATE INDEX "TechnicalInspection_status_createdAt_idx" ON "TechnicalInspection"("status", "createdAt");

ALTER TABLE "TechnicalInspection" ADD CONSTRAINT "TechnicalInspection_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TechnicalInspection" ADD CONSTRAINT "TechnicalInspection_requestedBy_fkey"
    FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable TechnicalInspectionCounter (singleton)
CREATE TABLE "TechnicalInspectionCounter" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "yearlyCounters" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TechnicalInspectionCounter_pkey" PRIMARY KEY ("id")
);
