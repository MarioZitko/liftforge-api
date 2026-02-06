import { Test, TestingModule } from '@nestjs/testing';
import { ClientProgramController } from './client-program.controller';

describe('ClientProgramController', () => {
  let controller: ClientProgramController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientProgramController],
    }).compile();

    controller = module.get<ClientProgramController>(ClientProgramController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
