-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "lookingForCoach" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Coach" ADD COLUMN     "lookingForClients" BOOLEAN NOT NULL DEFAULT false;
