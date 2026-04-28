import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTrainingExerciseDto } from './dto/create-training-exercise.dto';
import { UpdateTrainingExerciseDto } from './dto/update-training-exercise.dto';

@Injectable()
export class TrainingExerciseService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTrainingExerciseDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const te = await tx.trainingExercise.create({
        data: {
          trainingId: dto.trainingId,
          exerciseId: dto.exerciseId,
          sortOrder: dto.sortOrder,
          sets: dto.sets,
          reps: dto.reps,
          weight: dto.weight,
          rpePlanned: dto.rpePlanned,
          rpeActual: dto.rpeActual,
          intensity: dto.intensity,
          percentageOfMax: dto.percentageOfMax,
          note: dto.note,
          videoUrl: dto.videoUrl,
          createdById: userId,
        },
        include: { exercise: true },
      });

      const vol = await tx.volume.create({
        data: {
          trainingExerciseId: te.id,
          volumeTotal: dto.sets * dto.reps * dto.weight,
          createdById: userId,
        },
      });

      await tx.trainingExercise.update({
        where: { id: te.id },
        data: { volumeId: vol.id },
      });

      return { ...te, volume: vol };
    });
  }

  async findByTraining(trainingId: number) {
    return this.prisma.trainingExercise.findMany({
      where: { trainingId },
      orderBy: { sortOrder: 'asc' },
      include: { exercise: true, volume: true },
    });
  }

  async findOne(id: number) {
    const te = await this.prisma.trainingExercise.findUnique({
      where: { id },
      include: { exercise: true, volume: true },
    });
    if (!te) throw new NotFoundException(`TrainingExercise ${id} not found`);
    return te;
  }

  async update(id: number, dto: UpdateTrainingExerciseDto) {
    const existing = await this.findOne(id);

    const updated = await this.prisma.trainingExercise.update({
      where: { id },
      data: dto,
      include: { exercise: true, volume: true },
    });

    // Recompute volume if any of the three volume-affecting fields changed
    const sets = dto.sets ?? existing.sets;
    const reps = dto.reps ?? existing.reps;
    const weight = dto.weight ?? existing.weight;
    if (dto.sets !== undefined || dto.reps !== undefined || dto.weight !== undefined) {
      if (existing.volumeId) {
        await this.prisma.volume.update({
          where: { id: existing.volumeId },
          data: { volumeTotal: sets * reps * weight },
        });
      }
    }

    return updated;
  }

  async reorder(trainingId: number, orderedIds: number[]) {
    await Promise.all(
      orderedIds.map((id, index) =>
        this.prisma.trainingExercise.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
    return this.findByTraining(trainingId);
  }

  async remove(id: number) {
    const te = await this.findOne(id);
    if (te.volumeId) {
      await this.prisma.volume.delete({ where: { id: te.volumeId } });
    }
    return this.prisma.trainingExercise.delete({ where: { id } });
  }
}
