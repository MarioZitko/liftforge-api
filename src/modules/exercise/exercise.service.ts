// src/modules/exercise/exercise.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';

@Injectable()
export class ExerciseService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateExerciseDto) {
    return this.prisma.exercise.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.exercise.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const exercise = await this.prisma.exercise.findUnique({ where: { id } });
    if (!exercise) throw new NotFoundException('Exercise not found');
    return exercise;
  }

  async findForCoach(userId: string, onlyMine: boolean) {
    return this.prisma.exercise.findMany({
      where: onlyMine
        ? { createdById: userId }
        : {
            OR: [{ createdById: null }, { createdById: userId }],
          },
      orderBy: { name: 'asc' },
    });
  }

  async update(id: number, data: UpdateExerciseDto) {
    return this.prisma.exercise.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.exercise.delete({ where: { id } });
  }
}
