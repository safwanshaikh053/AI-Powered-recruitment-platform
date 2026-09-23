/*
  Warnings:

  - Added the required column `fileKey` to the `Resume` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "extractedText" TEXT,
ADD COLUMN     "fileKey" TEXT NOT NULL;
