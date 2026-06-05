-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "bio" TEXT;

-- AlterTable
ALTER TABLE "Coach" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "lookingForClients" BOOLEAN NOT NULL DEFAULT true;
