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
import { TrainingBlockService } from './training-block.service';

describe('TrainingBlockService', () => {
  let module: TestingModule;
  let service: TrainingBlockService;
  let prisma: PrismaService;
  let coachUserId: string | undefined;
  let otherCoachUserId: string | undefined;
  let programId: number | undefined;
  const createdBlockIds: number[] = [];

  beforeAll(async () => {
    module = await createDbTestingModule({
      providers: [TrainingBlockService],
    });

    service = module.get<TrainingBlockService>(TrainingBlockService);
    prisma = module.get<PrismaService>(PrismaService);

    const [coachUser, otherCoachUser] = await Promise.all([
      createTestUser(prisma, Role.COACH),
      createTestUser(prisma, Role.COACH),
    ]);
    coachUserId = coachUser.id;
    otherCoachUserId = otherCoachUser.id;

    const program = await prisma.program.create({
      data: { name: uniqueTag('tb-program'), createdById: coachUserId },
    });
    programId = program.id;
  });

  afterAll(async () => {
    await prisma.trainingBlock.deleteMany({ where: { id: { in: createdBlockIds } } });
    if (programId) await prisma.program.deleteMany({ where: { id: programId } });
    await deleteTestUser(prisma, coachUserId);
    await deleteTestUser(prisma, otherCoachUserId);
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a block under the program, finds it, updates it, and removes it', async () => {
    const created = await service.create(
      { name: uniqueTag('block'), programId: programId! },
      coachUserId!,
    );
    createdBlockIds.push(created.id);
    expect(created.createdById).toBe(coachUserId);

    const found = await service.findOne(created.id, { userId: coachUserId!, role: Role.COACH });
    expect(found.id).toBe(created.id);

    const updated = await service.update(
      created.id,
      { name: 'renamed block' },
      { userId: coachUserId!, role: Role.COACH },
    );
    expect(updated.name).toBe('renamed block');

    await service.remove(created.id, { userId: coachUserId!, role: Role.COACH });

    await expect(
      service.findOne(created.id, { userId: coachUserId!, role: Role.COACH }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects access from a coach who does not own the parent program', async () => {
    const created = await service.create(
      { name: uniqueTag('block'), programId: programId! },
      coachUserId!,
    );
    createdBlockIds.push(created.id);

    await expect(
      service.findOne(created.id, { userId: otherCoachUserId!, role: Role.COACH }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('findByProgram() returns the blocks for that program', async () => {
    const blocks = await service.findByProgram(programId!);
    expect(blocks.some((b) => createdBlockIds.includes(b.id))).toBe(true);
  });
});
