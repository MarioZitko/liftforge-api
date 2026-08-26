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
import { ClientProgramService } from './client-program.service';

describe('ClientProgramService', () => {
  let module: TestingModule;
  let service: ClientProgramService;
  let prisma: PrismaService;
  let coachUserId: string | undefined;
  let coachId: string;
  let otherCoachUserId: string | undefined;
  let clientUserId: string | undefined;
  let clientId: string;
  let programId: number | undefined;
  const createdClientProgramIds: number[] = [];

  beforeAll(async () => {
    module = await createDbTestingModule({
      providers: [ClientProgramService],
    });

    service = module.get<ClientProgramService>(ClientProgramService);
    prisma = module.get<PrismaService>(PrismaService);

    const [coachUser, otherCoachUser, clientUser] = await Promise.all([
      createTestUser(prisma, Role.COACH),
      // No Coach profile needed: assertClientProgramAccess only checks the ClientProgram's own
      // `coachId`, never the requesting user's own Coach row, so this user only needs to exist.
      prisma.user.create({
        data: {
          email: `${uniqueTag('cp-other-coach')}@example.test`,
          password: 'not-a-real-hash',
          role: Role.COACH,
        },
      }),
      createTestUser(prisma, Role.CLIENT),
    ]);
    coachUserId = coachUser.id;
    otherCoachUserId = otherCoachUser.id;
    clientUserId = clientUser.id;

    const [coach, client, program] = await Promise.all([
      prisma.coach.findUniqueOrThrow({ where: { userId: coachUserId } }),
      prisma.client.findUniqueOrThrow({ where: { userId: clientUserId } }),
      prisma.program.create({ data: { name: uniqueTag('cp-program'), createdById: coachUserId } }),
    ]);
    coachId = coach.id;
    clientId = client.id;
    programId = program.id;
  });

  afterAll(async () => {
    await prisma.clientProgram.deleteMany({ where: { id: { in: createdClientProgramIds } } });
    if (programId) await prisma.program.deleteMany({ where: { id: programId } });
    await deleteTestUser(prisma, coachUserId);
    await deleteTestUser(prisma, otherCoachUserId);
    await deleteTestUser(prisma, clientUserId);
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a client program, is visible to the owning coach and assigned client, and can be updated and removed', async () => {
    const created = await service.create({
      clientId,
      name: uniqueTag('assignment'),
      programId: programId!,
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-03-01T00:00:00.000Z',
      status: 'active',
      coachId,
    });
    createdClientProgramIds.push(created.id);

    const foundByCoach = await service.findOne(created.id, { userId: coachUserId!, role: Role.COACH });
    expect(foundByCoach.id).toBe(created.id);

    const foundByClient = await service.findOne(created.id, { userId: clientUserId!, role: Role.CLIENT });
    expect(foundByClient.id).toBe(created.id);

    const updated = await service.update(
      created.id,
      { status: 'completed' },
      { userId: coachUserId!, role: Role.COACH },
    );
    expect(updated.status).toBe('completed');

    await service.remove(created.id, { userId: coachUserId!, role: Role.COACH });

    await expect(
      service.findOne(created.id, { userId: coachUserId!, role: Role.COACH }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects access from a coach who is not assigned to the client program', async () => {
    const created = await service.create({
      clientId,
      name: uniqueTag('assignment'),
      programId: programId!,
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-03-01T00:00:00.000Z',
      status: 'active',
      coachId,
    });
    createdClientProgramIds.push(created.id);

    await expect(
      service.findOne(created.id, { userId: otherCoachUserId!, role: Role.COACH }),
    ).rejects.toThrow(ForbiddenException);
  });
});
