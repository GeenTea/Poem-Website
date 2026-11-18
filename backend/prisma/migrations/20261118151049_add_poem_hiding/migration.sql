-- AlterTable
ALTER TABLE "Poem" ADD COLUMN     "hiddenAt" TIMESTAMP(3),
ADD COLUMN     "hiddenById" TEXT;

-- AddForeignKey
ALTER TABLE "Poem" ADD CONSTRAINT "Poem_hiddenById_fkey" FOREIGN KEY ("hiddenById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
