import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let service: { findAll: jest.Mock; findOne: jest.Mock; create: jest.Mock };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: service }],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findOne() returns the user when found', async () => {
    const user = { id: 'u1', email: 'a@example.test' };
    service.findOne.mockResolvedValue(user);

    const result = await controller.findOne('u1');

    expect(service.findOne).toHaveBeenCalledWith('u1');
    expect(result).toBe(user);
  });

  it('findOne() throws NotFoundException when the service returns null', async () => {
    service.findOne.mockResolvedValue(null);

    await expect(controller.findOne('missing')).rejects.toThrow(NotFoundException);
  });

  it('create() delegates to the service with the DTO', async () => {
    const dto = { email: 'a@example.test', password: 'password123', role: 'CLIENT' } as any;
    const created = { id: 'u1', ...dto };
    service.create.mockResolvedValue(created);

    const result = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toBe(created);
  });
});
