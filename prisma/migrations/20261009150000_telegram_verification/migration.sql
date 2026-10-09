-- AlterTable
ALTER TABLE "users" ADD COLUMN     "telegramId" TEXT;

-- AlterTable
ALTER TABLE "verification_codes" ADD COLUMN     "externalId" TEXT,
ALTER COLUMN "target" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_telegramId_key" ON "users"("telegramId");

-- CreateIndex
CREATE INDEX "verification_codes_codeHash_idx" ON "verification_codes"("codeHash");

-- CreateIndex
CREATE INDEX "verification_codes_externalId_idx" ON "verification_codes"("externalId");

