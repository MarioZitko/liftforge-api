import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { Role } from 'generated/prisma';
import { PrismaService } from '@/prisma/prisma.service';
import {
  createDbTestingModule,
  createTestUser,
  deleteTestUser,
  uniqueTag,
} from '@/test-utils/db-test.helper';
import { TrainingExerciseService } from './training-exercise.service';

describe('TrainingExerciseService', () => {
  let module: TestingModule;
  let service: TrainingExerciseService;
  let prisma: PrismaService;
  let coachUserId: string | undefined;
  let programId: number | undefined;
  let blockId: number | undefined;
  let weekId: number | undefined;
  let trainingId: number | undefined;
  let exerciseId: number | undefined;
  const createdTrainingExerciseIds: number[] = [];

  beforeAll(async () => {
    module = await createDbTestingModule({
      providers: [TrainingExerciseService],
    });

    service = module.get<TrainingExerciseService>(TrainingExerciseService);
    prisma = module.get<PrismaService>(PrismaService);

    const coachUser = await createTestUser(prisma, Role.COACH);
    coachUserId = coachUser.id;

    const program = await prisma.program.create({
      data: { name: uniqueTag('te-program'), createdById: coachUserId },
    });
    programId = program.id;

    const block = await prisma.trainingBlock.create({
      data: { name: uniqueTag('te-block'), description: '', programId, createdById: coachUserId },
    });
    blockId = block.id;

    const week = await prisma.trainingWeek.create({
      data: { name: uniqueTag('te-week'), number: 1, blockId, createdById: coachUserId },
    });
    weekId = week.id;

    const training = await prisma.training.create({
      data: {
        name: uniqueTag('te-training'),
        date: new Date('2026-02-01T00:00:00.000Z'),
        weekId,
        createdById: coachUserId,
      },
    });
    trainingId = training.id;

    const exercise = await prisma.exercise.create({ data: { name: uniqueTag('te-exercise') } });
    exerciseId = exercise.id;
  });

  afterAll(async () => {
    await prisma.volume.deleteMany({ where: { trainingExerciseId: { in: createdTrainingExerciseIds } } });
    await prisma.trainingExercise.deleteMany({ where: { id: { in: createdTrainingExerciseIds } } });
    if (exerciseId) await prisma.exercise.deleteMany({ where: { id: exerciseId } });
    if (trainingId) await prisma.training.deleteMany({ where: { id: trainingId } });
    if (weekId) await prisma.trainingWeek.deleteMany({ where: { id: weekId } });
    if (blockId) await prisma.trainingBlock.deleteMany({ where: { id: blockId } });
    if (programId) await prisma.program.deleteMany({ where: { id: programId } });
    await deleteTestUser(prisma, coachUserId);
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a training exercise with its Volume row computed from sets/reps/weight, finds it, updates it, and removes it', async () => {
    const created = await service.create(
      { trainingId: trainingId!, exerciseId: exerciseId!, sortOrder: 0, sets: 3, reps: 10, weight: 50 },
      coachUserId!,
    );
    createdTrainingExerciseIds.push(created.id);
    expect(created.volume.volumeTotal).toBe(3 * 10 * 50);

    const found = await service.findOne(created.id, { userId: coachUserId!, role: Role.COACH });
    expect(found.id).toBe(created.id);

    const updated = await service.update(
      created.id,
      { weight: 60 },
      { userId: coachUserId!, role: Role.COACH },
    );
    expect(updated.weight).toBe(60);

    const recomputedVolume = await prisma.volume.findUnique({ where: { trainingExerciseId: created.id } });
    expect(recomputedVolume?.volumeTotal).toBe(3 * 10 * 60);

    await service.remove(created.id, { userId: coachUserId!, role: Role.COACH });

    await expect(
      service.findOne(created.id, { userId: coachUserId!, role: Role.COACH }),
    ).rejects.toThrow(NotFoundException);
    expect(await prisma.volume.findUnique({ where: { trainingExerciseId: created.id } })).toBeNull();
  });

  it('findByTraining() returns the exercises for that training', async () => {
    const created = await service.create(
      { trainingId: trainingId!, exerciseId: exerciseId!, sortOrder: 1, sets: 5, reps: 5, weight: 100 },
      coachUserId!,
    );
    createdTrainingExerciseIds.push(created.id);

    const results = await service.findByTraining(trainingId!);
    expect(results.some((te) => te.id === created.id)).toBe(true);
  });
});
