import { Test, TestingModule } from '@nestjs/testing';
import { TrainingWeekService } from './training-week.service';

describe('TrainingWeekService', () => {
  let service: TrainingWeekService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrainingWeekService],
    }).compile();

    service = module.get<TrainingWeekService>(TrainingWeekService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
