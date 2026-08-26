import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { createDbTestingModule, uniqueTag } from '@/test-utils/db-test.helper';
import { ExerciseService } from './exercise.service';

describe('ExerciseService', () => {
  let module: TestingModule;
  let service: ExerciseService;
  let prisma: PrismaService;
  const createdIds: number[] = [];

  beforeAll(async () => {
    module = await createDbTestingModule({
      providers: [ExerciseService],
    });

    service = module.get<ExerciseService>(ExerciseService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.exercise.deleteMany({ where: { id: { in: createdIds } } });
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates an exercise, finds it by id, updates it, and removes it', async () => {
    const created = await service.create({ name: uniqueTag('exercise') });
    createdIds.push(created.id);

    const found = await service.findOne(created.id);
    expect(found.id).toBe(created.id);

    const updated = await service.update(created.id, { description: 'updated description' });
    expect(updated.description).toBe('updated description');

    await service.remove(created.id);

    await expect(service.findOne(created.id)).rejects.toThrow(NotFoundException);
  });

  it('findOne() throws NotFoundException for a non-existent id', async () => {
    await expect(service.findOne(-1)).rejects.toThrow(NotFoundException);
  });
});
