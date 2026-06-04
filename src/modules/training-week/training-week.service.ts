import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTrainingWeekDto } from './dto/create-training-week.dto';
import { UpdateTrainingWeekDto } from './dto/update-training-week.dto';

@Injectable()
export class TrainingWeekService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTrainingWeekDto, userId: string) {
    return this.prisma.trainingWeek.create({
      data: {
        name: dto.name,
        number: dto.number,
        blockId: dto.blockId,
        createdById: userId,
      },
      include: { trainings: true },
    });
  }

  async findByBlock(blockId: number) {
    return this.prisma.trainingWeek.findMany({
      where: { blockId },
      orderBy: { number: 'asc' },
      include: {
        trainings: { orderBy: { date: 'asc' } },
      },
    });
  }

  async findOne(id: number) {
    const week = await this.prisma.trainingWeek.findUnique({
      where: { id },
      include: { trainings: true },
    });
    if (!week) throw new NotFoundException(`TrainingWeek ${id} not found`);
    return week;
  }

  async update(id: number, dto: UpdateTrainingWeekDto) {
    await this.findOne(id);
    return this.prisma.trainingWeek.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    const week = await this.prisma.trainingWeek.findUnique({
      where: { id },
      include: { trainings: { include: { trainingExercises: true } } },
    });
    if (!week) throw new NotFoundException(`TrainingWeek ${id} not found`);

    const trainingIds = week.trainings.map((t) => t.id);
    const teIds = week.trainings.flatMap((t) => t.trainingExercises.map((te) => te.id));

    await this.prisma.volume.deleteMany({ where: { trainingExerciseId: { in: teIds } } });
    await this.prisma.trainingExercise.deleteMany({ where: { trainingId: { in: trainingIds } } });
    await this.prisma.training.deleteMany({ where: { weekId: id } });
    return this.prisma.trainingWeek.delete({ where: { id } });
  }
}
