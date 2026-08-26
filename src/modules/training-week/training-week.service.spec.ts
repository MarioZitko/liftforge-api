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
import { TrainingWeekService } from './training-week.service';

describe('TrainingWeekService', () => {
  let module: TestingModule;
  let service: TrainingWeekService;
  let prisma: PrismaService;
  let coachUserId: string | undefined;
  let otherCoachUserId: string | undefined;
  let programId: number | undefined;
  let blockId: number | undefined;
  const createdWeekIds: number[] = [];

  beforeAll(async () => {
    module = await createDbTestingModule({
      providers: [TrainingWeekService],
    });

    service = module.get<TrainingWeekService>(TrainingWeekService);
    prisma = module.get<PrismaService>(PrismaService);

    const [coachUser, otherCoachUser] = await Promise.all([
      createTestUser(prisma, Role.COACH),
      createTestUser(prisma, Role.COACH),
    ]);
    coachUserId = coachUser.id;
    otherCoachUserId = otherCoachUser.id;

    const program = await prisma.program.create({
      data: { name: uniqueTag('tw-program'), createdById: coachUserId },
    });
    programId = program.id;

    const block = await prisma.trainingBlock.create({
      data: { name: uniqueTag('tw-block'), description: '', programId, createdById: coachUserId },
    });
    blockId = block.id;
  });

  afterAll(async () => {
    await prisma.trainingWeek.deleteMany({ where: { id: { in: createdWeekIds } } });
    if (blockId) await prisma.trainingBlock.deleteMany({ where: { id: blockId } });
    if (programId) await prisma.program.deleteMany({ where: { id: programId } });
    await deleteTestUser(prisma, coachUserId);
    await deleteTestUser(prisma, otherCoachUserId);
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a week under the block, finds it, updates it, and removes it', async () => {
    const created = await service.create(
      { name: uniqueTag('week'), number: 1, blockId: blockId! },
      coachUserId!,
    );
    createdWeekIds.push(created.id);
    expect(created.createdById).toBe(coachUserId);

    const found = await service.findOne(created.id, { userId: coachUserId!, role: Role.COACH });
    expect(found.id).toBe(created.id);

    const updated = await service.update(
      created.id,
      { name: 'renamed week' },
      { userId: coachUserId!, role: Role.COACH },
    );
    expect(updated.name).toBe('renamed week');

    await service.remove(created.id, { userId: coachUserId!, role: Role.COACH });

    await expect(
      service.findOne(created.id, { userId: coachUserId!, role: Role.COACH }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects access from a coach who does not own the parent program', async () => {
    const created = await service.create(
      { name: uniqueTag('week'), number: 2, blockId: blockId! },
      coachUserId!,
    );
    createdWeekIds.push(created.id);

    await expect(
      service.findOne(created.id, { userId: otherCoachUserId!, role: Role.COACH }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('findByBlock() returns the weeks for that block', async () => {
    const weeks = await service.findByBlock(blockId!);
    expect(weeks.some((w) => createdWeekIds.includes(w.id))).toBe(true);
  });
});
