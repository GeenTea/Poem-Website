-- Жалобы на стихи: тип жалобы как enum + на кого жалоба (targetUserId).
-- SQL поправлен вручную, чтобы сохранить уже существующие жалобы.

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('COMMENT', 'POEM', 'USER');

-- type: String -> ReportType. Prisma хотел удалить колонку и создать заново (данные пропали бы);
-- вместо этого меняем тип на месте: существующее значение 'COMMENT' приводится к enum.
ALTER TABLE "Report"
  ALTER COLUMN "type" TYPE "ReportType" USING "type"::"ReportType";

-- targetUserId: сначала добавляем как необязательное...
ALTER TABLE "Report" ADD COLUMN "targetUserId" TEXT;

-- ...заполняем у старых жалоб: на комментарий -> автор комментария, на стих -> автор стиха...
UPDATE "Report" r SET "targetUserId" = c."authorId"
  FROM "Comment" c WHERE r."commentId" = c."id" AND r."targetUserId" IS NULL;
UPDATE "Report" r SET "targetUserId" = p."authorId"
  FROM "Poem" p WHERE r."commentId" IS NULL AND r."poemId" = p."id" AND r."targetUserId" IS NULL;

-- ...жалобы, у которых цель определить нельзя, удаляем (на практике таких нет)...
DELETE FROM "Report" WHERE "targetUserId" IS NULL;

-- ...и только потом делаем обязательным.
ALTER TABLE "Report" ALTER COLUMN "targetUserId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Report_targetUserId_idx" ON "Report"("targetUserId");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
