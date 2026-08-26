import { Test, TestingModule } from '@nestjs/testing';
import { Role } from 'generated/prisma';
import { TrainingController } from './training.controller';
import { TrainingService } from './training.service';

describe('TrainingController', () => {
  let controller: TrainingController;
  let service: { create: jest.Mock; findOne: jest.Mock; findByWeek: jest.Mock };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findOne: jest.fn(),
      findByWeek: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrainingController],
      providers: [{ provide: TrainingService, useValue: service }],
    }).compile();

    controller = module.get<TrainingController>(TrainingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create() delegates to the service with the DTO and the current user id', async () => {
    const dto = { name: 'Session 1', date: '2026-02-01', weekId: 1 };
    const created = { id: 1, ...dto };
    service.create.mockResolvedValue(created);

    const result = await controller.create(dto as any, { userId: 'coach-1', role: Role.COACH } as any);

    expect(service.create).toHaveBeenCalledWith(dto, 'coach-1');
    expect(result).toBe(created);
  });

  it('findAll() returns trainings for the given weekId query param', async () => {
    const trainings = [{ id: 1 }];
    service.findByWeek.mockResolvedValue(trainings);

    const result = await controller.findAll('4');

    expect(service.findByWeek).toHaveBeenCalledWith(4);
    expect(result).toBe(trainings);
  });

  it('findAll() returns an empty array when no weekId is given', async () => {
    const result = await controller.findAll();

    expect(result).toEqual([]);
    expect(service.findByWeek).not.toHaveBeenCalled();
  });
});
