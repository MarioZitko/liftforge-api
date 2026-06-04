import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTrainingBlockDto } from './dto/create-training-block.dto';
import { UpdateTrainingBlockDto } from './dto/update-training-block.dto';

@Injectable()
export class TrainingBlockService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTrainingBlockDto, userId: string) {
    return this.prisma.trainingBlock.create({
      data: {
        name: dto.name,
        description: dto.description ?? '',
        programId: dto.programId,
        createdById: userId,
      },
      include: { weeks: true },
    });
  }

  async findByProgram(programId: number) {
    return this.prisma.trainingBlock.findMany({
      where: { programId },
      orderBy: { id: 'asc' },
      include: {
        weeks: {
          orderBy: { number: 'asc' },
          include: {
            trainings: {
              orderBy: { date: 'asc' },
              include: {
                trainingExercises: {
                  orderBy: { sortOrder: 'asc' },
                  include: { exercise: true, volume: true },
                },
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const block = await this.prisma.trainingBlock.findUnique({
      where: { id },
      include: { weeks: true },
    });
    if (!block) throw new NotFoundException(`TrainingBlock ${id} not found`);
    return block;
  }

  async update(id: number, dto: UpdateTrainingBlockDto) {
    await this.findOne(id);
    return this.prisma.trainingBlock.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    const block = await this.prisma.trainingBlock.findUnique({
      where: { id },
      include: {
        weeks: { include: { trainings: { include: { trainingExercises: true } } } },
      },
    });
    if (!block) throw new NotFoundException(`TrainingBlock ${id} not found`);

    const weekIds = block.weeks.map((w) => w.id);
    const trainingIds = block.weeks.flatMap((w) => w.trainings.map((t) => t.id));
    const teIds = block.weeks.flatMap((w) =>
      w.trainings.flatMap((t) => t.trainingExercises.map((te) => te.id)),
    );

    await this.prisma.volume.deleteMany({ where: { trainingExerciseId: { in: teIds } } });
    await this.prisma.trainingExercise.deleteMany({ where: { trainingId: { in: trainingIds } } });
    await this.prisma.training.deleteMany({ where: { weekId: { in: weekIds } } });
    await this.prisma.trainingWeek.deleteMany({ where: { blockId: id } });
    return this.prisma.trainingBlock.delete({ where: { id } });
  }
}
