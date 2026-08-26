import { TestingModule } from '@nestjs/testing';
import { Role } from 'generated/prisma';
import { PrismaService } from '@/prisma/prisma.service';
import { createDbTestingModule, uniqueTag } from '@/test-utils/db-test.helper';
import { UserService } from './user.service';

describe('UserService', () => {
  let module: TestingModule;
  let service: UserService;
  let prisma: PrismaService;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    module = await createDbTestingModule({
      providers: [UserService],
    });

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.client.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.coach.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a CLIENT user with its Client profile, finds it, updates it, and deletes it', async () => {
    const email = `${uniqueTag('user')}@example.test`;
    const created = await service.create({
      email,
      password: 'password123',
      name: 'Spec User',
      role: Role.CLIENT,
    });
    createdUserIds.push(created.id);

    const clientProfile = await prisma.client.findUnique({ where: { userId: created.id } });
    expect(clientProfile).not.toBeNull();

    const found = await service.findOne(created.id);
    expect(found?.email).toBe(email);

    const updated = await service.update(created.id, { name: 'Updated Name' });
    expect(updated.name).toBe('Updated Name');

    await service.delete(created.id);

    const afterDelete = await service.findOne(created.id);
    expect(afterDelete).toBeNull();
    expect(await prisma.client.findUnique({ where: { userId: created.id } })).toBeNull();
  });

  it('findByEmail() returns the created user', async () => {
    const email = `${uniqueTag('user')}@example.test`;
    const created = await service.create({
      email,
      password: 'password123',
      role: Role.COACH,
    });
    createdUserIds.push(created.id);

    const found = await service.findByEmail(email);
    expect(found?.id).toBe(created.id);
  });
});
