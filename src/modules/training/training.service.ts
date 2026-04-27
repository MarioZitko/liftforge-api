import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';

@Injectable()
export class TrainingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTrainingDto, userId: string) {
    return this.prisma.training.create({
      data: {
        name: dto.name,
        date: new Date(dto.date),
        weekId: dto.weekId,
        createdById: userId,
      },
    });
  }

  async findByWeek(weekId: number) {
    return this.prisma.training.findMany({
      where: { weekId },
      orderBy: { date: 'asc' },
      include: {
        trainingExercises: {
          orderBy: { sortOrder: 'asc' },
          include: { exercise: true },
        },
      },
    });
  }

  async findOne(id: number) {
    const training = await this.prisma.training.findUnique({
      where: { id },
      include: {
        trainingExercises: {
          orderBy: { sortOrder: 'asc' },
          include: { exercise: true },
        },
      },
    });
    if (!training) throw new NotFoundException(`Training ${id} not found`);
    return training;
  }

  async update(id: number, dto: UpdateTrainingDto) {
    await this.findOne(id);
    return this.prisma.training.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.date ? { date: new Date(dto.date) } : {}),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.training.delete({ where: { id } });
  }
}
