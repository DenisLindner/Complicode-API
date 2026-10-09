-- CreateEnum
CREATE TYPE "ChallengeLevel" AS ENUM ('INTERN', 'JUNIOR', 'MID', 'SENIOR');

-- CreateTable
CREATE TABLE "stacks" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "stacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frameworks" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "frameworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FrameworkToStack" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FrameworkToStack_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "stacks_slug_key" ON "stacks"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "frameworks_slug_key" ON "frameworks"("slug");

-- CreateIndex
CREATE INDEX "_FrameworkToStack_B_index" ON "_FrameworkToStack"("B");

-- AddForeignKey
ALTER TABLE "_FrameworkToStack" ADD CONSTRAINT "_FrameworkToStack_A_fkey" FOREIGN KEY ("A") REFERENCES "frameworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FrameworkToStack" ADD CONSTRAINT "_FrameworkToStack_B_fkey" FOREIGN KEY ("B") REFERENCES "stacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
