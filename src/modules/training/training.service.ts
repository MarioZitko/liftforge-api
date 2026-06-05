import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTrainingDto } from './dto/create-training.dto';
import { ScheduleProgramDto } from './dto/schedule-program.dto';
import { TrainingCalendarItemDto } from './dto/training-calendar-item.dto';
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
      include: {
        trainingExercises: {
          orderBy: { sortOrder: 'asc' },
          include: { exercise: true },
        },
      },
    });
  }

  async findForCoachCalendar(
    userId: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<TrainingCalendarItemDto[]> {
    const coach = await this.prisma.coach.findUnique({ where: { userId } });
    if (!coach) return [];

    const trainings = await this.prisma.training.findMany({
      where: {
        date: { gte: new Date(dateFrom), lte: new Date(dateTo) },
        week: {
          block: {
            program: {
              clientProgram: {
                client: { coachId: coach.id },
              },
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        date: true,
        weekId: true,
        _count: { select: { trainingExercises: true } },
        week: {
          select: {
            block: {
              select: {
                program: {
                  select: {
                    id: true,
                    clientProgram: {
                      select: {
                        client: {
                          select: {
                            id: true,
                            user: { select: { name: true } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    return trainings.map((t) => ({
      id: t.id,
      name: t.name,
      date: t.date.toISOString().split('T')[0],
      weekId: t.weekId,
      exerciseCount: t._count.trainingExercises,
      clientId: t.week.block.program?.clientProgram?.client.id ?? '',
      clientName: t.week.block.program?.clientProgram?.client.user.name ?? 'Unknown',
      programId: t.week.block.program?.id ?? 0,
    }));
  }

  async findForClientCalendar(
    userId: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<TrainingCalendarItemDto[]> {
    const client = await this.prisma.client.findUnique({ where: { userId } });
    if (!client) return [];

    const trainings = await this.prisma.training.findMany({
      where: {
        date: { gte: new Date(dateFrom), lte: new Date(dateTo) },
        week: {
          block: {
            program: {
              clientProgram: { clientId: client.id },
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        date: true,
        weekId: true,
        _count: { select: { trainingExercises: true } },
        week: {
          select: {
            block: {
              select: {
                program: {
                  select: {
                    id: true,
                    clientProgram: {
                      select: {
                        client: {
                          select: {
                            id: true,
                            user: { select: { name: true } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    return trainings.map((t) => ({
      id: t.id,
      name: t.name,
      date: t.date.toISOString().split('T')[0],
      weekId: t.weekId,
      exerciseCount: t._count.trainingExercises,
      clientId: t.week.block.program?.clientProgram?.client.id ?? '',
      clientName: t.week.block.program?.clientProgram?.client.user.name ?? 'Unknown',
      programId: t.week.block.program?.id ?? 0,
    }));
  }

  async scheduleProgram(dto: ScheduleProgramDto): Promise<{ scheduledCount: number }> {
    const blocks = await this.prisma.trainingBlock.findMany({
      where: { programId: dto.programId },
      include: {
        weeks: {
          orderBy: { number: 'asc' },
          include: { trainings: { orderBy: { id: 'asc' } } },
        },
      },
      orderBy: { id: 'asc' },
    });

    const sessionIds: number[] = [];
    for (const block of blocks) {
      for (const week of block.weeks) {
        for (const training of week.trainings) {
          sessionIds.push(training.id);
        }
      }
    }

    if (sessionIds.length === 0) return { scheduledCount: 0 };

    const dates = this.generateTrainingDates(
      new Date(dto.startDate),
      dto.trainingDays,
      sessionIds.length,
    );

    await this.prisma.$transaction(
      sessionIds.map((id, i) =>
        this.prisma.training.update({
          where: { id },
          data: { date: dates[i] },
        }),
      ),
    );

    return { scheduledCount: sessionIds.length };
  }

  private generateTrainingDates(startDate: Date, trainingDays: number[], count: number): Date[] {
    const sorted = [...new Set(trainingDays)].sort((a, b) => a - b);
    const dates: Date[] = [];
    const cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);

    let safety = 0;
    while (dates.length < count && safety < 1000) {
      if (sorted.includes(cursor.getDay())) {
        dates.push(new Date(cursor));
      }
      cursor.setDate(cursor.getDate() + 1);
      safety++;
    }

    return dates;
  }

  async remove(id: number) {
    const training = await this.prisma.training.findUnique({
      where: { id },
      include: { trainingExercises: true },
    });
    if (!training) throw new NotFoundException(`Training ${id} not found`);

    const teIds = training.trainingExercises.map((te) => te.id);
    await this.prisma.volume.deleteMany({ where: { trainingExerciseId: { in: teIds } } });
    await this.prisma.trainingExercise.deleteMany({ where: { trainingId: id } });
    return this.prisma.training.delete({ where: { id } });
  }
}
