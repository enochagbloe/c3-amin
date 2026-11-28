CREATE TABLE "OrganizationRecent" ("id" TEXT NOT NULL, "userId" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "path" TEXT NOT NULL, "requestId" TEXT, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "OrganizationRecent_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "OrganizationRecent_userId_organizationId_path_key" ON "OrganizationRecent"("userId", "organizationId", "path");
CREATE INDEX "OrganizationRecent_organizationId_userId_updatedAt_idx" ON "OrganizationRecent"("organizationId", "userId", "updatedAt");
ALTER TABLE "OrganizationRecent" ADD CONSTRAINT "OrganizationRecent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationRecent" ADD CONSTRAINT "OrganizationRecent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationRecent" ADD CONSTRAINT "OrganizationRecent_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BudgetRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
