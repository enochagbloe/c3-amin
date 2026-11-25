-- CreateEnum
CREATE TYPE "BudgetRequestStatus" AS ENUM ('PENDING_MAIN', 'PENDING_SECOND', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BudgetRequestStage" AS ENUM ('SUBMITTED', 'MAIN', 'SECOND');

-- CreateEnum
CREATE TYPE "BudgetRequestAction" AS ENUM ('REASSIGNED', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "budgetPastorId" TEXT,
ADD COLUMN     "budgetReviewerId" TEXT;

-- CreateTable
CREATE TABLE "BudgetRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "mainApproverId" TEXT NOT NULL,
    "secondApproverId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "neededBy" TIMESTAMP(3),
    "status" "BudgetRequestStatus" NOT NULL DEFAULT 'PENDING_MAIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetRequestEvent" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "stage" "BudgetRequestStage" NOT NULL,
    "action" "BudgetRequestAction" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetRequestEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BudgetRequest_organizationId_requesterId_createdAt_idx" ON "BudgetRequest"("organizationId", "requesterId", "createdAt");

-- CreateIndex
CREATE INDEX "BudgetRequest_organizationId_mainApproverId_status_idx" ON "BudgetRequest"("organizationId", "mainApproverId", "status");

-- CreateIndex
CREATE INDEX "BudgetRequest_organizationId_secondApproverId_status_idx" ON "BudgetRequest"("organizationId", "secondApproverId", "status");

-- CreateIndex
CREATE INDEX "BudgetRequestEvent_requestId_createdAt_idx" ON "BudgetRequestEvent"("requestId", "createdAt");

-- AddForeignKey
ALTER TABLE "BudgetRequest" ADD CONSTRAINT "BudgetRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetRequest" ADD CONSTRAINT "BudgetRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetRequest" ADD CONSTRAINT "BudgetRequest_mainApproverId_fkey" FOREIGN KEY ("mainApproverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetRequest" ADD CONSTRAINT "BudgetRequest_secondApproverId_fkey" FOREIGN KEY ("secondApproverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetRequestEvent" ADD CONSTRAINT "BudgetRequestEvent_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BudgetRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetRequestEvent" ADD CONSTRAINT "BudgetRequestEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
