/*
  Warnings:

  - Added the required column `name` to the `ClientProgram` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Training` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `TrainingBlock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `TrainingWeek` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ClientProgram" ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Training" ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TrainingBlock" ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TrainingWeek" ADD COLUMN     "name" TEXT NOT NULL;
