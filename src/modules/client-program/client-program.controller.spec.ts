import { Test, TestingModule } from '@nestjs/testing';
import { Role } from 'generated/prisma';
import { ClientProgramController } from './client-program.controller';
import { ClientProgramService } from './client-program.service';

describe('ClientProgramController', () => {
  let controller: ClientProgramController;
  let service: { create: jest.Mock; findOne: jest.Mock; findForCoach: jest.Mock };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findOne: jest.fn(),
      findForCoach: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientProgramController],
      providers: [{ provide: ClientProgramService, useValue: service }],
    }).compile();

    controller = module.get<ClientProgramController>(ClientProgramController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create() delegates to the service with the DTO', async () => {
    const dto = { clientId: 'client-1', programId: 1 };
    const created = { id: 1, ...dto };
    service.create.mockResolvedValue(created);

    const result = await controller.create(dto as any);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toBe(created);
  });

  it('findOne() coerces the id param to a number and passes the requesting user', async () => {
    const clientProgram = { id: 7 };
    service.findOne.mockResolvedValue(clientProgram);

    const result = await controller.findOne('7', { userId: 'coach-1', role: Role.COACH } as any);

    expect(service.findOne).toHaveBeenCalledWith(7, { userId: 'coach-1', role: Role.COACH });
    expect(result).toBe(clientProgram);
  });

  it('getCoachClientPrograms() delegates to the service with the requesting user id', async () => {
    const programs = [{ id: 1 }];
    service.findForCoach.mockResolvedValue(programs);

    const result = await controller.getCoachClientPrograms({ userId: 'coach-1' } as any);

    expect(service.findForCoach).toHaveBeenCalledWith('coach-1');
    expect(result).toBe(programs);
  });
});
