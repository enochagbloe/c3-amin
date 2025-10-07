/*
  Warnings:

  - You are about to drop the `ExpensisTracker` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('pending', 'approved', 'failed');

-- DropTable
DROP TABLE "public"."ExpensisTracker";

-- CreateTable
CREATE TABLE "ExpenseTracker" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "Status" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "author" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "ExpenseTracker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExpenseTracker_author_idx" ON "ExpenseTracker"("author");

-- CreateIndex
CREATE INDEX "ExpenseTracker_date_idx" ON "ExpenseTracker"("date");
