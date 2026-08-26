import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { Role } from 'generated/prisma';
import { PrismaService } from '@/prisma/prisma.service';
import { createDbTestingModule, uniqueTag } from '@/test-utils/db-test.helper';
import { ClientService } from './client.service';

describe('ClientService', () => {
  let module: TestingModule;
  let service: ClientService;
  let prisma: PrismaService;
  let userId: string | undefined;
  const createdClientIds: string[] = [];

  beforeAll(async () => {
    module = await createDbTestingModule({
      providers: [ClientService],
    });

    service = module.get<ClientService>(ClientService);
    prisma = module.get<PrismaService>(PrismaService);

    const user = await prisma.user.create({
      data: {
        email: `${uniqueTag('client-owner')}@example.test`,
        password: 'not-a-real-hash',
        role: Role.CLIENT,
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.client.deleteMany({ where: { id: { in: createdClientIds } } });
    if (userId) await prisma.user.deleteMany({ where: { id: userId } });
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a client profile, finds it by id and by userId, updates it, and removes it', async () => {
    const created = await service.create({ userId: userId! });
    createdClientIds.push(created.id);

    const foundById = await service.findOne(created.id);
    expect(foundById.userId).toBe(userId);

    const foundByUserId = await service.findByUserId(userId!);
    expect(foundByUserId.id).toBe(created.id);

    const updated = await service.update(created.id, { dateOfBirth: '1995-05-20T00:00:00.000Z' });
    expect(updated.dateOfBirth?.toISOString().startsWith('1995-05-20')).toBe(true);

    await service.remove(created.id);

    await expect(service.findOne(created.id)).rejects.toThrow(NotFoundException);
  });

  it('findOne() throws NotFoundException for a non-existent id', async () => {
    await expect(service.findOne('does-not-exist')).rejects.toThrow(NotFoundException);
  });
});
