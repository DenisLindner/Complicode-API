-- A first generation that fails no longer leaves a challenge behind: the
-- challenge is removed and the credit refunded. Failed challenges have no
-- content and their credit was already refunded, so they are deleted.

-- AlterEnum
BEGIN;
DELETE FROM "challenges" WHERE "status" = 'FAILED';
CREATE TYPE "ChallengeStatus_new" AS ENUM ('GENERATING', 'READY');
ALTER TABLE "public"."challenges" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "challenges" ALTER COLUMN "status" TYPE "ChallengeStatus_new" USING ("status"::text::"ChallengeStatus_new");
ALTER TYPE "ChallengeStatus" RENAME TO "ChallengeStatus_old";
ALTER TYPE "ChallengeStatus_new" RENAME TO "ChallengeStatus";
DROP TYPE "public"."ChallengeStatus_old";
ALTER TABLE "challenges" ALTER COLUMN "status" SET DEFAULT 'GENERATING';
COMMIT;
