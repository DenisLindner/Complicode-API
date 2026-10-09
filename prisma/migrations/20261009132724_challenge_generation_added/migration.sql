/*
  Warnings:

  - You are about to drop the column `body` on the `challenges` table. All the data in the column will be lost.
  - Added the required column `frameworkId` to the `challenges` table without a default value. This is not possible if the table is not empty.
  - Added the required column `level` to the `challenges` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stackId` to the `challenges` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `challenges` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('GENERATING', 'READY', 'FAILED');

-- AlterTable
ALTER TABLE "challenges" DROP COLUMN "body",
ADD COLUMN     "context" TEXT,
ADD COLUMN     "deliverables" TEXT[],
ADD COLUMN     "description" TEXT,
ADD COLUMN     "frameworkId" TEXT NOT NULL,
ADD COLUMN     "level" "ChallengeLevel" NOT NULL,
ADD COLUMN     "regenerationsUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stackId" TEXT NOT NULL,
ADD COLUMN     "status" "ChallengeStatus" NOT NULL DEFAULT 'GENERATING',
ADD COLUMN     "technologies" TEXT[],
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "title" DROP NOT NULL,
ALTER COLUMN "public" SET DEFAULT false;

-- CreateTable
CREATE TABLE "challenge_versions" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "technologies" TEXT[],
    "deliverables" TEXT[],
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "challenge_versions_challengeId_version_key" ON "challenge_versions"("challengeId", "version");

-- CreateIndex
CREATE INDEX "challenges_userId_createdAt_idx" ON "challenges"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "challenges_public_status_createdAt_idx" ON "challenges"("public", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_stackId_fkey" FOREIGN KEY ("stackId") REFERENCES "stacks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "frameworks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_versions" ADD CONSTRAINT "challenge_versions_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
