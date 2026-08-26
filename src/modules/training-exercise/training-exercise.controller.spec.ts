import { Test, TestingModule } from '@nestjs/testing';
import { Role } from 'generated/prisma';
import { TrainingExerciseController } from './training-exercise.controller';
import { TrainingExerciseService } from './training-exercise.service';

describe('TrainingExerciseController', () => {
  let controller: TrainingExerciseController;
  let service: { create: jest.Mock; findOne: jest.Mock; findByTraining: jest.Mock; reorder: jest.Mock };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findOne: jest.fn(),
      findByTraining: jest.fn(),
      reorder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrainingExerciseController],
      providers: [{ provide: TrainingExerciseService, useValue: service }],
    }).compile();

    controller = module.get<TrainingExerciseController>(TrainingExerciseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create() delegates to the service with the DTO and the current user id', async () => {
    const dto = { trainingId: 1, exerciseId: 2, sortOrder: 0, sets: 3, reps: 10, weight: 50 };
    const created = { id: 1, ...dto };
    service.create.mockResolvedValue(created);

    const result = await controller.create(dto as any, { userId: 'coach-1', role: Role.COACH } as any);

    expect(service.create).toHaveBeenCalledWith(dto, 'coach-1');
    expect(result).toBe(created);
  });

  it('findAll() returns exercises for the given trainingId query param', async () => {
    const exercises = [{ id: 1 }];
    service.findByTraining.mockResolvedValue(exercises);

    const result = await controller.findAll('6');

    expect(service.findByTraining).toHaveBeenCalledWith(6);
    expect(result).toBe(exercises);
  });

  it('reorder() delegates to the service with the training id and ordered ids', async () => {
    const reordered = [{ id: 2 }, { id: 1 }];
    service.reorder.mockResolvedValue(reordered);

    const result = await controller.reorder({ trainingId: 6, orderedIds: [2, 1] });

    expect(service.reorder).toHaveBeenCalledWith(6, [2, 1]);
    expect(result).toBe(reordered);
  });
});
