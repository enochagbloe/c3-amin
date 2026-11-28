ALTER TABLE "BudgetNotification" ADD COLUMN "ownerOnly" BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE "OrganizationUpdateRead" ("id" TEXT NOT NULL, "userId" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "updateId" TEXT NOT NULL, "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "OrganizationUpdateRead_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "OrganizationUpdateRead_userId_organizationId_updateId_key" ON "OrganizationUpdateRead"("userId", "organizationId", "updateId");
ALTER TABLE "OrganizationUpdateRead" ADD CONSTRAINT "OrganizationUpdateRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationUpdateRead" ADD CONSTRAINT "OrganizationUpdateRead_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
