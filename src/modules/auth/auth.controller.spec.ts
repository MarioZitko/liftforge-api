import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: { register: jest.Mock; login: jest.Mock; refreshTokens: jest.Mock };

  beforeEach(async () => {
    service = {
      register: jest.fn(),
      login: jest.fn(),
      refreshTokens: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: service }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('register() delegates to the service with the DTO and invite token', async () => {
    const dto = { name: 'A', email: 'a@example.test', password: 'password123', firstName: 'A', lastName: 'B' };
    const response = { message: 'Registration successful. Please verify your email before logging in.' };
    service.register.mockResolvedValue(response);

    const result = await controller.register(dto as any, 'invite-token');

    expect(service.register).toHaveBeenCalledWith(dto, 'invite-token');
    expect(result).toBe(response);
  });

  it('login() delegates to the service with the DTO and response object', async () => {
    const dto = { email: 'a@example.test', password: 'password123' };
    const res = {} as Response;
    const response = { message: 'Login successful' };
    service.login.mockResolvedValue(response);

    const result = await controller.login(dto, res);

    expect(service.login).toHaveBeenCalledWith(dto, res);
    expect(result).toBe(response);
  });

  it('refreshToken() throws UnauthorizedException when no refresh token cookie is present', async () => {
    const req = { cookies: {} } as any;
    const res = {} as Response;

    await expect(controller.refreshToken(req, res)).rejects.toThrow(UnauthorizedException);
    expect(service.refreshTokens).not.toHaveBeenCalled();
  });

  it('getMe() returns the current user from the request', () => {
    const user = { userId: 'u1', email: 'a@example.test', role: 'CLIENT' };

    expect(controller.getMe(user)).toBe(user);
  });
});
