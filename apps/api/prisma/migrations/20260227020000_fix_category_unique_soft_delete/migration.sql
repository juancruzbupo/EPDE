-- DropIndex
DROP INDEX "Category_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_deletedAt_key" ON "Category"("name", "deletedAt");
