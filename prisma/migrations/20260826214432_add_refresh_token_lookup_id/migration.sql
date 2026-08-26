-- AlterTable
ALTER TABLE "User" ADD COLUMN "refreshTokenId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_refreshTokenId_key" ON "User"("refreshTokenId");
