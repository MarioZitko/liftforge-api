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
import { ProgramService } from './program.service';

describe('ProgramService', () => {
  let module: TestingModule;
  let service: ProgramService;
  let prisma: PrismaService;
  let coachId: string | undefined;
  let otherCoachId: string | undefined;
  const createdProgramIds: number[] = [];

  beforeAll(async () => {
    module = await createDbTestingModule({
      providers: [ProgramService],
    });

    service = module.get<ProgramService>(ProgramService);
    prisma = module.get<PrismaService>(PrismaService);

    const [coach, otherCoach] = await Promise.all([
      createTestUser(prisma, Role.COACH),
      createTestUser(prisma, Role.COACH),
    ]);
    coachId = coach.id;
    otherCoachId = otherCoach.id;
  });

  afterAll(async () => {
    await prisma.program.deleteMany({ where: { id: { in: createdProgramIds } } });
    await deleteTestUser(prisma, coachId);
    await deleteTestUser(prisma, otherCoachId);
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a program owned by the requesting coach, finds it, updates it, and removes it', async () => {
    const created = await service.create({ name: uniqueTag('program') }, coachId!);
    createdProgramIds.push(created.id);
    expect(created.createdById).toBe(coachId);

    const found = await service.findOne(created.id, { userId: coachId!, role: Role.COACH });
    expect(found.id).toBe(created.id);

    const updated = await service.update(
      created.id,
      { description: 'updated' },
      { userId: coachId!, role: Role.COACH },
    );
    expect(updated.description).toBe('updated');

    await service.remove(created.id, { userId: coachId!, role: Role.COACH });

    await expect(
      service.findOne(created.id, { userId: coachId!, role: Role.COACH }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects access from a coach who does not own the program', async () => {
    const created = await service.create({ name: uniqueTag('program') }, coachId!);
    createdProgramIds.push(created.id);

    await expect(
      service.findOne(created.id, { userId: otherCoachId!, role: Role.COACH }),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      service.update(created.id, { description: 'x' }, { userId: otherCoachId!, role: Role.COACH }),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      service.remove(created.id, { userId: otherCoachId!, role: Role.COACH }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('findOne() throws NotFoundException for a non-existent id', async () => {
    await expect(
      service.findOne(-1, { userId: coachId!, role: Role.COACH }),
    ).rejects.toThrow(NotFoundException);
  });
});
