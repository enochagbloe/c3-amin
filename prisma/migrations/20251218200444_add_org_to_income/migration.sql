-- AlterTable
ALTER TABLE "Income" ADD COLUMN     "organizationId" TEXT;

-- CreateIndex
CREATE INDEX "Income_organizationId_idx" ON "Income"("organizationId");

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
