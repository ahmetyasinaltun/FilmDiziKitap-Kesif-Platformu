-- AlterTable
ALTER TABLE "Content" ADD COLUMN     "authorNames" TEXT[] DEFAULT ARRAY[]::TEXT[];
