/*
  Warnings:

  - You are about to alter the column `icon` on the `Category` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.

*/
-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "icon" SET DATA TYPE VARCHAR(50);
