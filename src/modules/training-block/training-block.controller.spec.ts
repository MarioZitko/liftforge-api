import { Test, TestingModule } from '@nestjs/testing';
import { TrainingBlockController } from './training-block.controller';

describe('TrainingBlockController', () => {
  let controller: TrainingBlockController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrainingBlockController],
    }).compile();

    controller = module.get<TrainingBlockController>(TrainingBlockController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
