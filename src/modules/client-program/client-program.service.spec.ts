import { Test, TestingModule } from '@nestjs/testing';
import { ClientProgramService } from './client-program.service';

describe('ClientProgramService', () => {
  let service: ClientProgramService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientProgramService],
    }).compile();

    service = module.get<ClientProgramService>(ClientProgramService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
