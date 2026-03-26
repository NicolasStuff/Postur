-- AlterTable
ALTER TABLE "User" ADD COLUMN "completedTours" JSONB NOT NULL DEFAULT '[]';
