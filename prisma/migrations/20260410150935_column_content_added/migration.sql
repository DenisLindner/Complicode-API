/*
  Warnings:

  - Added the required column `content` to the `challenges` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "challenges" ADD COLUMN     "content" TEXT NOT NULL;
