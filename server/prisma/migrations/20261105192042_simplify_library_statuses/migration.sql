-- AlterEnum
BEGIN;
CREATE TYPE "LibraryStatus_new" AS ENUM ('PLANNED', 'COMPLETED');
ALTER TABLE "LibraryEntry" ALTER COLUMN "status" TYPE "LibraryStatus_new" USING ("status"::text::"LibraryStatus_new");
ALTER TYPE "LibraryStatus" RENAME TO "LibraryStatus_old";
ALTER TYPE "LibraryStatus_new" RENAME TO "LibraryStatus";
DROP TYPE "public"."LibraryStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "LibraryEntry" DROP COLUMN "currentEpisode",
DROP COLUMN "currentPage",
DROP COLUMN "currentSeason",
DROP COLUMN "startedAt";

