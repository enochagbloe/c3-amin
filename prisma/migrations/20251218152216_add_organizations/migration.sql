-- AlterTable
ALTER TABLE "ExpenseTracker" ADD COLUMN     "organizationId" TEXT;

-- CreateIndex
CREATE INDEX "ExpenseTracker_organizationId_idx" ON "ExpenseTracker"("organizationId");

-- AddForeignKey
ALTER TABLE "ExpenseTracker" ADD CONSTRAINT "ExpenseTracker_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
