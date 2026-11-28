ALTER TABLE "BudgetNotification" ALTER COLUMN "requestId" DROP NOT NULL;
ALTER TABLE "BudgetNotification" ADD COLUMN "actorId" TEXT, ADD COLUMN "actorName" TEXT, ADD COLUMN "href" TEXT;
ALTER TABLE "BudgetNotification" ADD CONSTRAINT "BudgetNotification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
