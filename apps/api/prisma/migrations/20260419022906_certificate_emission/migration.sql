-- CreateTable
CREATE TABLE "CertificateEmission" (
    "id" TEXT NOT NULL,
    "certificateNumber" INTEGER NOT NULL,
    "propertyId" TEXT NOT NULL,
    "issuedBy" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "healthIndexScore" INTEGER NOT NULL,
    "pdfUrl" TEXT,

    CONSTRAINT "CertificateEmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CertificateEmission_certificateNumber_key" ON "CertificateEmission"("certificateNumber");

-- CreateIndex
CREATE INDEX "CertificateEmission_propertyId_issuedAt_idx" ON "CertificateEmission"("propertyId", "issuedAt" DESC);

-- CreateIndex
CREATE INDEX "CertificateEmission_issuedAt_idx" ON "CertificateEmission"("issuedAt");

-- AddForeignKey
ALTER TABLE "CertificateEmission" ADD CONSTRAINT "CertificateEmission_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
