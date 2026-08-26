import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { Role } from 'generated/prisma';
import { PrismaService } from '@/prisma/prisma.service';
import {
  createDbTestingModule,
  createTestUser,
  deleteTestUser,
  uniqueTag,
} from '@/test-utils/db-test.helper';
import { TrainingService } from './training.service';

describe('TrainingService', () => {
  let module: TestingModule;
  let service: TrainingService;
  let prisma: PrismaService;
  let coachUserId: string | undefined;
  let otherCoachUserId: string | undefined;
  let programId: number | undefined;
  let blockId: number | undefined;
  let weekId: number | undefined;
  const createdTrainingIds: number[] = [];

  beforeAll(async () => {
    module = await createDbTestingModule({
      providers: [TrainingService],
    });

    service = module.get<TrainingService>(TrainingService);
    prisma = module.get<PrismaService>(PrismaService);

    const [coachUser, otherCoachUser] = await Promise.all([
      createTestUser(prisma, Role.COACH),
      createTestUser(prisma, Role.COACH),
    ]);
    coachUserId = coachUser.id;
    otherCoachUserId = otherCoachUser.id;

    const program = await prisma.program.create({
      data: { name: uniqueTag('tr-program'), createdById: coachUserId },
    });
    programId = program.id;

    const block = await prisma.trainingBlock.create({
      data: { name: uniqueTag('tr-block'), description: '', programId, createdById: coachUserId },
    });
    blockId = block.id;

    const week = await prisma.trainingWeek.create({
      data: { name: uniqueTag('tr-week'), number: 1, blockId, createdById: coachUserId },
    });
    weekId = week.id;
  });

  afterAll(async () => {
    await prisma.training.deleteMany({ where: { id: { in: createdTrainingIds } } });
    if (weekId) await prisma.trainingWeek.deleteMany({ where: { id: weekId } });
    if (blockId) await prisma.trainingBlock.deleteMany({ where: { id: blockId } });
    if (programId) await prisma.program.deleteMany({ where: { id: programId } });
    await deleteTestUser(prisma, coachUserId);
    await deleteTestUser(prisma, otherCoachUserId);
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a training session under the week, finds it, updates it, and removes it', async () => {
    const created = await service.create(
      { name: uniqueTag('training'), date: '2026-02-01T00:00:00.000Z', weekId: weekId! },
      coachUserId!,
    );
    createdTrainingIds.push(created.id);
    expect(created.createdById).toBe(coachUserId);

    const found = await service.findOne(created.id, { userId: coachUserId!, role: Role.COACH });
    expect(found.id).toBe(created.id);

    const updated = await service.update(
      created.id,
      { name: 'renamed training' },
      { userId: coachUserId!, role: Role.COACH },
    );
    expect(updated.name).toBe('renamed training');

    await service.remove(created.id, { userId: coachUserId!, role: Role.COACH });

    await expect(
      service.findOne(created.id, { userId: coachUserId!, role: Role.COACH }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects access from a coach who does not own the parent program', async () => {
    const created = await service.create(
      { name: uniqueTag('training'), date: '2026-02-01T00:00:00.000Z', weekId: weekId! },
      coachUserId!,
    );
    createdTrainingIds.push(created.id);

    await expect(
      service.findOne(created.id, { userId: otherCoachUserId!, role: Role.COACH }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('findByWeek() returns the trainings for that week', async () => {
    const trainings = await service.findByWeek(weekId!);
    expect(trainings.some((t) => createdTrainingIds.includes(t.id))).toBe(true);
  });
});
