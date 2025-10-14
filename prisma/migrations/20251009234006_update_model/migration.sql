/*
  Warnings:

  - The values [failed] on the enum `Status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Status_new" AS ENUM ('pending', 'approved', 'rejected');
ALTER TABLE "public"."ExpenseTracker" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ExpenseTracker" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TYPE "Status" RENAME TO "Status_old";
ALTER TYPE "Status_new" RENAME TO "Status";
DROP TYPE "public"."Status_old";
ALTER TABLE "ExpenseTracker" ALTER COLUMN "status" SET DEFAULT 'pending';
COMMIT;
