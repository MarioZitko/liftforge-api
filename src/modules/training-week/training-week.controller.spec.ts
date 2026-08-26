import { Test, TestingModule } from '@nestjs/testing';
import { Role } from 'generated/prisma';
import { TrainingWeekController } from './training-week.controller';
import { TrainingWeekService } from './training-week.service';

describe('TrainingWeekController', () => {
  let controller: TrainingWeekController;
  let service: { create: jest.Mock; findOne: jest.Mock; findByBlock: jest.Mock };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findOne: jest.fn(),
      findByBlock: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrainingWeekController],
      providers: [{ provide: TrainingWeekService, useValue: service }],
    }).compile();

    controller = module.get<TrainingWeekController>(TrainingWeekController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create() delegates to the service with the DTO and the current user id', async () => {
    const dto = { name: 'Week 1', number: 1, blockId: 1 };
    const created = { id: 1, ...dto };
    service.create.mockResolvedValue(created);

    const result = await controller.create(dto as any, { userId: 'coach-1', role: Role.COACH } as any);

    expect(service.create).toHaveBeenCalledWith(dto, 'coach-1');
    expect(result).toBe(created);
  });

  it('findAll() returns weeks for the given blockId query param', async () => {
    const weeks = [{ id: 1 }];
    service.findByBlock.mockResolvedValue(weeks);

    const result = await controller.findAll('9');

    expect(service.findByBlock).toHaveBeenCalledWith(9);
    expect(result).toBe(weeks);
  });

  it('findAll() returns an empty array when no blockId is given', async () => {
    const result = await controller.findAll();

    expect(result).toEqual([]);
    expect(service.findByBlock).not.toHaveBeenCalled();
  });
});
