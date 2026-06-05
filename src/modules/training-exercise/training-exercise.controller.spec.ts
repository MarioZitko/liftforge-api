import { Test, TestingModule } from '@nestjs/testing';
import { TrainingExerciseController } from './training-exercise.controller';

describe('TrainingExerciseController', () => {
  let controller: TrainingExerciseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrainingExerciseController],
    }).compile();

    controller = module.get<TrainingExerciseController>(TrainingExerciseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
