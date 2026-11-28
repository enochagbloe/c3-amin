ALTER TABLE "User" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
CREATE TABLE "PasswordResetToken" ("id" TEXT NOT NULL, "accountId" TEXT NOT NULL, "tokenHash" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "PasswordResetToken_accountId_key" ON "PasswordResetToken"("accountId");
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE TABLE "PasswordResetThrottle" ("key" TEXT NOT NULL, "windowStart" TIMESTAMP(3) NOT NULL, "lastRequestedAt" TIMESTAMP(3) NOT NULL, "count" INTEGER NOT NULL, CONSTRAINT "PasswordResetThrottle_pkey" PRIMARY KEY ("key"));
