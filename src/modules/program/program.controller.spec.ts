import { Test, TestingModule } from '@nestjs/testing';
import { Role } from 'generated/prisma';
import { ProgramController } from './program.controller';
import { ProgramService } from './program.service';

describe('ProgramController', () => {
  let controller: ProgramController;
  let service: { create: jest.Mock; findOne: jest.Mock; update: jest.Mock; remove: jest.Mock };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProgramController],
      providers: [{ provide: ProgramService, useValue: service }],
    }).compile();

    controller = module.get<ProgramController>(ProgramController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create() delegates to the service with the DTO and the current user id', async () => {
    const dto = { name: 'Strength Block' };
    const created = { id: 1, ...dto };
    service.create.mockResolvedValue(created);

    const result = await controller.create(dto as any, {
      userId: 'coach-1',
      role: Role.COACH,
    } as any);

    expect(service.create).toHaveBeenCalledWith(dto, 'coach-1');
    expect(result).toBe(created);
  });

  it('findOne() coerces the id param to a number and passes the requesting user', async () => {
    const program = { id: 42, name: 'Strength Block' };
    service.findOne.mockResolvedValue(program);

    const result = await controller.findOne('42', { userId: 'coach-1', role: Role.COACH } as any);

    expect(service.findOne).toHaveBeenCalledWith(42, { userId: 'coach-1', role: Role.COACH });
    expect(result).toBe(program);
  });
});
