import { Test, TestingModule } from '@nestjs/testing';
import { ExerciseController } from './exercise.controller';
import { ExerciseService } from './exercise.service';

describe('ExerciseController', () => {
  let controller: ExerciseController;
  let service: { create: jest.Mock; findAll: jest.Mock };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExerciseController],
      providers: [{ provide: ExerciseService, useValue: service }],
    }).compile();

    controller = module.get<ExerciseController>(ExerciseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create() delegates to the service with the DTO', async () => {
    const dto = { name: 'Bench Press' };
    const created = { id: 1, ...dto };
    service.create.mockResolvedValue(created);

    const result = await controller.create(dto as any);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toBe(created);
  });

  it('findAll() delegates to the service', async () => {
    const exercises = [{ id: 1, name: 'Squat' }];
    service.findAll.mockResolvedValue(exercises);

    const result = await controller.findAll();

    expect(service.findAll).toHaveBeenCalled();
    expect(result).toBe(exercises);
  });
});
