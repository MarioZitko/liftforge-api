import { Test, TestingModule } from '@nestjs/testing';
import { TrainingExerciseService } from './training-exercise.service';

describe('TrainingExerciseService', () => {
  let service: TrainingExerciseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrainingExerciseService],
    }).compile();

    service = module.get<TrainingExerciseService>(TrainingExerciseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
