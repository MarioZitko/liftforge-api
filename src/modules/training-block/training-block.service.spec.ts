import { Test, TestingModule } from '@nestjs/testing';
import { TrainingBlockService } from './training-block.service';

describe('TrainingBlockService', () => {
  let service: TrainingBlockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrainingBlockService],
    }).compile();

    service = module.get<TrainingBlockService>(TrainingBlockService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
