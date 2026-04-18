-- CreateTable
CREATE TABLE "CertificateCounter" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertificateCounter_pkey" PRIMARY KEY ("id")
);
