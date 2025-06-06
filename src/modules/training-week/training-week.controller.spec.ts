import { Test, TestingModule } from '@nestjs/testing';
import { TrainingWeekController } from './training-week.controller';

describe('TrainingWeekController', () => {
  let controller: TrainingWeekController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrainingWeekController],
    }).compile();

    controller = module.get<TrainingWeekController>(TrainingWeekController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
