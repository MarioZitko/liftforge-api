import { Test, TestingModule } from '@nestjs/testing';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';

describe('ClientController', () => {
  let controller: ClientController;
  let service: { create: jest.Mock; findOne: jest.Mock };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientController],
      providers: [{ provide: ClientService, useValue: service }],
    }).compile();

    controller = module.get<ClientController>(ClientController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create() delegates to the service with the DTO', async () => {
    const dto = { userId: 'user-1' };
    const created = { id: 'client-1', ...dto };
    service.create.mockResolvedValue(created);

    const result = await controller.create(dto as any);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toBe(created);
  });

  it('findOne() delegates to the service with the id', async () => {
    const client = { id: 'client-1', userId: 'user-1' };
    service.findOne.mockResolvedValue(client);

    const result = await controller.findOne('client-1');

    expect(service.findOne).toHaveBeenCalledWith('client-1');
    expect(result).toBe(client);
  });
});
