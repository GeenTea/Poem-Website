/*
  Warnings:

  - A unique constraint covering the columns `[reporterId,commentId]` on the table `Report` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'REPORT_CREATED';

-- CreateIndex
CREATE UNIQUE INDEX "Report_reporterId_commentId_key" ON "Report"("reporterId", "commentId");
