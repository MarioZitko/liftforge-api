import { Test, TestingModule } from '@nestjs/testing';
import { CoachController } from './coach.controller';
import { CoachService } from './coach.service';

describe('CoachController', () => {
  let controller: CoachController;
  let service: { create: jest.Mock; findOne: jest.Mock; inviteClient: jest.Mock };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findOne: jest.fn(),
      inviteClient: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoachController],
      providers: [{ provide: CoachService, useValue: service }],
    }).compile();

    controller = module.get<CoachController>(CoachController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create() delegates to the service with the DTO', async () => {
    const dto = { userId: 'user-1' };
    const created = { id: 'coach-1', ...dto };
    service.create.mockResolvedValue(created);

    const result = await controller.create(dto as any);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toBe(created);
  });

  it('inviteClient() delegates to the service with the requesting user id and email', async () => {
    const response = { message: 'Registration invitation sent successfully' };
    service.inviteClient.mockResolvedValue(response);

    const result = await controller.inviteClient({ userId: 'coach-user-1' }, {
      email: 'client@example.test',
    });

    expect(service.inviteClient).toHaveBeenCalledWith('coach-user-1', 'client@example.test');
    expect(result).toBe(response);
  });
});
