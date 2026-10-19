-- Interface and content language. English is the base language for new rows;
-- everything that exists before this migration was written in Portuguese.

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('en', 'pt', 'es');

-- AlterTable
ALTER TABLE "challenges" ADD COLUMN     "locale" "Locale" NOT NULL DEFAULT 'pt';
ALTER TABLE "challenges" ALTER COLUMN "locale" SET DEFAULT 'en';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "locale" "Locale" NOT NULL DEFAULT 'pt';
ALTER TABLE "users" ALTER COLUMN "locale" SET DEFAULT 'en';
