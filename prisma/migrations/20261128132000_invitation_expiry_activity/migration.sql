ALTER TABLE "OrganizationInvitation" ADD COLUMN "expiryNotifiedAt" TIMESTAMP(3);
CREATE INDEX "OrganizationInvitation_organizationId_status_expiresAt_idx" ON "OrganizationInvitation"("organizationId", "status", "expiresAt");
