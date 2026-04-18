-- CreateEnum
CREATE TYPE "ProfessionalSpecialty" AS ENUM ('ELECTRICIAN', 'PLUMBER_GASFITTER', 'ARCHITECT_ENGINEER', 'ROOFER_WATERPROOFER', 'PEST_CONTROL', 'HVAC_TECHNICIAN', 'FIRE_SAFETY', 'DOCUMENTATION_NORMATIVE', 'PAINTER', 'SOLAR_SPECIALIST', 'WATER_TECHNICIAN', 'CARPENTER', 'LANDSCAPER');

-- CreateEnum
CREATE TYPE "ProfessionalAvailability" AS ENUM ('AVAILABLE', 'BUSY', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "ProfessionalTier" AS ENUM ('A', 'B', 'C', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ProfessionalAttachmentType" AS ENUM ('MATRICULA', 'SEGURO_RC', 'DNI', 'CERTIFICADO_CURSO', 'OTRO');

-- CreateEnum
CREATE TYPE "ProfessionalPaymentStatus" AS ENUM ('PENDING', 'PAID', 'CANCELED');

-- CreateTable
CREATE TABLE "Professional" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "photoUrl" TEXT,
    "bio" VARCHAR(1000),
    "registrationNumber" VARCHAR(50) NOT NULL,
    "registrationBody" VARCHAR(200) NOT NULL,
    "serviceAreas" TEXT[],
    "yearsOfExperience" INTEGER,
    "hourlyRateMin" DECIMAL(10,2),
    "hourlyRateMax" DECIMAL(10,2),
    "availability" "ProfessionalAvailability" NOT NULL DEFAULT 'AVAILABLE',
    "availableUntil" TIMESTAMP(3),
    "tier" "ProfessionalTier" NOT NULL DEFAULT 'B',
    "blockedReason" VARCHAR(500),
    "notes" VARCHAR(4000),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Professional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalSpecialtyAssignment" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "specialty" "ProfessionalSpecialty" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProfessionalSpecialtyAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalAttachment" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "type" "ProfessionalAttachmentType" NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" VARCHAR(200) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfessionalAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalRating" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "serviceRequestId" TEXT,
    "score" INTEGER NOT NULL,
    "punctuality" INTEGER,
    "quality" INTEGER,
    "priceValue" INTEGER,
    "adminComment" VARCHAR(2000),
    "clientComment" VARCHAR(2000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfessionalRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalTimelineNote" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" VARCHAR(2000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfessionalTimelineNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalTag" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "tag" VARCHAR(50) NOT NULL,

    CONSTRAINT "ProfessionalTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRequestAssignment" (
    "id" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,

    CONSTRAINT "ServiceRequestAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalPayment" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "serviceRequestId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "ProfessionalPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "paymentMethod" VARCHAR(50),
    "receiptUrl" TEXT,
    "notes" VARCHAR(1000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfessionalPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Professional_deletedAt_idx" ON "Professional"("deletedAt");

-- CreateIndex
CREATE INDEX "Professional_availability_deletedAt_idx" ON "Professional"("availability", "deletedAt");

-- CreateIndex
CREATE INDEX "Professional_tier_deletedAt_idx" ON "Professional"("tier", "deletedAt");

-- CreateIndex
CREATE INDEX "ProfessionalSpecialtyAssignment_specialty_idx" ON "ProfessionalSpecialtyAssignment"("specialty");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalSpecialtyAssignment_professionalId_specialty_key" ON "ProfessionalSpecialtyAssignment"("professionalId", "specialty");

-- CreateIndex
CREATE INDEX "ProfessionalAttachment_professionalId_idx" ON "ProfessionalAttachment"("professionalId");

-- CreateIndex
CREATE INDEX "ProfessionalAttachment_expiresAt_idx" ON "ProfessionalAttachment"("expiresAt");

-- CreateIndex
CREATE INDEX "ProfessionalAttachment_type_expiresAt_idx" ON "ProfessionalAttachment"("type", "expiresAt");

-- CreateIndex
CREATE INDEX "ProfessionalRating_professionalId_idx" ON "ProfessionalRating"("professionalId");

-- CreateIndex
CREATE INDEX "ProfessionalRating_professionalId_createdAt_idx" ON "ProfessionalRating"("professionalId", "createdAt");

-- CreateIndex
CREATE INDEX "ProfessionalTimelineNote_professionalId_createdAt_idx" ON "ProfessionalTimelineNote"("professionalId", "createdAt");

-- CreateIndex
CREATE INDEX "ProfessionalTag_tag_idx" ON "ProfessionalTag"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalTag_professionalId_tag_key" ON "ProfessionalTag"("professionalId", "tag");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRequestAssignment_serviceRequestId_key" ON "ServiceRequestAssignment"("serviceRequestId");

-- CreateIndex
CREATE INDEX "ServiceRequestAssignment_professionalId_idx" ON "ServiceRequestAssignment"("professionalId");

-- CreateIndex
CREATE INDEX "ServiceRequestAssignment_professionalId_assignedAt_idx" ON "ServiceRequestAssignment"("professionalId", "assignedAt");

-- CreateIndex
CREATE INDEX "ProfessionalPayment_professionalId_status_idx" ON "ProfessionalPayment"("professionalId", "status");

-- CreateIndex
CREATE INDEX "ProfessionalPayment_status_createdAt_idx" ON "ProfessionalPayment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ProfessionalPayment_serviceRequestId_idx" ON "ProfessionalPayment"("serviceRequestId");

-- AddForeignKey
ALTER TABLE "ProfessionalSpecialtyAssignment" ADD CONSTRAINT "ProfessionalSpecialtyAssignment_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalAttachment" ADD CONSTRAINT "ProfessionalAttachment_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalRating" ADD CONSTRAINT "ProfessionalRating_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalTimelineNote" ADD CONSTRAINT "ProfessionalTimelineNote_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalTag" ADD CONSTRAINT "ProfessionalTag_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequestAssignment" ADD CONSTRAINT "ServiceRequestAssignment_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequestAssignment" ADD CONSTRAINT "ServiceRequestAssignment_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalPayment" ADD CONSTRAINT "ProfessionalPayment_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
