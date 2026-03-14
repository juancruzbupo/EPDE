-- AlterTable: Add optional FK from Category to CategoryTemplate
ALTER TABLE "Category" ADD COLUMN "categoryTemplateId" TEXT;

-- CreateIndex
CREATE INDEX "Category_categoryTemplateId_idx" ON "Category"("categoryTemplateId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_categoryTemplateId_fkey" FOREIGN KEY ("categoryTemplateId") REFERENCES "CategoryTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DataMigration: Link existing categories to templates by matching name
UPDATE "Category" c
SET "categoryTemplateId" = ct.id
FROM "CategoryTemplate" ct
WHERE c.name = ct.name
  AND c."deletedAt" IS NULL;
