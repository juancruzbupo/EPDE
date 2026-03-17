-- CreateTable
CREATE TABLE "ISVSnapshot" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "score" INTEGER NOT NULL,
    "label" VARCHAR(50) NOT NULL,
    "compliance" INTEGER NOT NULL,
    "condition" INTEGER NOT NULL,
    "coverage" INTEGER NOT NULL,
    "investment" INTEGER NOT NULL,
    "trend" INTEGER NOT NULL,
    "sectorScores" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ISVSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ISVSnapshot_propertyId_idx" ON "ISVSnapshot"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "ISVSnapshot_propertyId_snapshotDate_key" ON "ISVSnapshot"("propertyId", "snapshotDate");

-- AddForeignKey
ALTER TABLE "ISVSnapshot" ADD CONSTRAINT "ISVSnapshot_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
