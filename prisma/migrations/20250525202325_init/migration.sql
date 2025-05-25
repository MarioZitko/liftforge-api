/*
  Warnings:

  - You are about to drop the column `volumeId` on the `Exercise` table. All the data in the column will be lost.
  - You are about to drop the column `volume` on the `TrainingExercise` table. All the data in the column will be lost.
  - You are about to drop the column `exerciseId` on the `Volume` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[volumeId]` on the table `TrainingExercise` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[trainingExerciseId]` on the table `Volume` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `volumeId` to the `TrainingExercise` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trainingExerciseId` to the `Volume` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Volume" DROP CONSTRAINT "Volume_exerciseId_fkey";

-- DropIndex
DROP INDEX "Exercise_volumeId_key";

-- DropIndex
DROP INDEX "Volume_exerciseId_key";

-- AlterTable
ALTER TABLE "Exercise" DROP COLUMN "volumeId";

-- AlterTable
ALTER TABLE "TrainingBlock" ADD COLUMN     "programId" INTEGER;

-- AlterTable
ALTER TABLE "TrainingExercise" DROP COLUMN "volume",
ADD COLUMN     "volumeId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Volume" DROP COLUMN "exerciseId",
ADD COLUMN     "trainingExerciseId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "coachId" TEXT,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coach" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "certification" TEXT,

    CONSTRAINT "Coach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientProgram" (
    "id" SERIAL NOT NULL,
    "clientId" TEXT NOT NULL,
    "programId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "coachId" TEXT,

    CONSTRAINT "ClientProgram_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_userId_key" ON "Client"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Coach_userId_key" ON "Coach"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientProgram_programId_key" ON "ClientProgram"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingExercise_volumeId_key" ON "TrainingExercise"("volumeId");

-- CreateIndex
CREATE UNIQUE INDEX "Volume_trainingExerciseId_key" ON "Volume"("trainingExerciseId");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coach" ADD CONSTRAINT "Coach_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientProgram" ADD CONSTRAINT "ClientProgram_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientProgram" ADD CONSTRAINT "ClientProgram_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientProgram" ADD CONSTRAINT "ClientProgram_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingBlock" ADD CONSTRAINT "TrainingBlock_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Volume" ADD CONSTRAINT "Volume_trainingExerciseId_fkey" FOREIGN KEY ("trainingExerciseId") REFERENCES "TrainingExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
