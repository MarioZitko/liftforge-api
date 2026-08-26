import { Test, TestingModule } from '@nestjs/testing';
import { Role } from 'generated/prisma';
import { TrainingBlockController } from './training-block.controller';
import { TrainingBlockService } from './training-block.service';

describe('TrainingBlockController', () => {
  let controller: TrainingBlockController;
  let service: { create: jest.Mock; findOne: jest.Mock; findByProgram: jest.Mock };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findOne: jest.fn(),
      findByProgram: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrainingBlockController],
      providers: [{ provide: TrainingBlockService, useValue: service }],
    }).compile();

    controller = module.get<TrainingBlockController>(TrainingBlockController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create() delegates to the service with the DTO and the current user id', async () => {
    const dto = { name: 'Block 1', programId: 1 };
    const created = { id: 1, ...dto };
    service.create.mockResolvedValue(created);

    const result = await controller.create(dto as any, { userId: 'coach-1', role: Role.COACH } as any);

    expect(service.create).toHaveBeenCalledWith(dto, 'coach-1');
    expect(result).toBe(created);
  });

  it('findAll() returns blocks for the given programId query param', async () => {
    const blocks = [{ id: 1 }];
    service.findByProgram.mockResolvedValue(blocks);

    const result = await controller.findAll('5');

    expect(service.findByProgram).toHaveBeenCalledWith(5);
    expect(result).toBe(blocks);
  });

  it('findAll() returns an empty array when no programId is given', async () => {
    const result = await controller.findAll();

    expect(result).toEqual([]);
    expect(service.findByProgram).not.toHaveBeenCalled();
  });

  it('findOne() passes the parsed id and requesting user to the service', async () => {
    const block = { id: 3 };
    service.findOne.mockResolvedValue(block);

    const result = await controller.findOne(3, { userId: 'coach-1', role: Role.COACH } as any);

    expect(service.findOne).toHaveBeenCalledWith(3, { userId: 'coach-1', role: Role.COACH });
    expect(result).toBe(block);
  });
});
