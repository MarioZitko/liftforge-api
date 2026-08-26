import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { PrismaService } from '@/prisma/prisma.service';
import { createDbTestingModule, deleteTestUser, uniqueTag } from '@/test-utils/db-test.helper';
import { EmailService } from '../email/email.service';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';

function createMockResponse(): Response {
  return { cookie: jest.fn(), clearCookie: jest.fn() } as unknown as Response;
}

describe('AuthService', () => {
  let module: TestingModule;
  let service: AuthService;
  let prisma: PrismaService;
  let emailService: { sendVerificationEmail: jest.Mock };
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    emailService = { sendVerificationEmail: jest.fn().mockResolvedValue(undefined) };

    module = await createDbTestingModule({
      imports: [JwtModule.register({ secret: 'test-jwt-secret' })],
      providers: [
        AuthService,
        UserService,
        { provide: EmailService, useValue: emailService },
      ],
    });

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    for (const id of createdUserIds) {
      await prisma.verificationToken.deleteMany({ where: { userId: id } });
      await deleteTestUser(prisma, id);
    }
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('register() creates the user, hashes the password, and sends a verification email', async () => {
    const email = `${uniqueTag('register')}@example.test`;
    const result = await service.register({
      name: 'Spec User',
      email,
      password: 'password123',
      firstName: 'Spec',
      lastName: 'User',
    });

    // Register the row for cleanup before any assertion below can throw — otherwise a failed
    // assertion here would leak this user permanently into the real dev DB (afterAll only cleans
    // up ids that made it into `createdUserIds`).
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('user not created');
    createdUserIds.push(user.id);

    expect(result.message).toContain('Registration successful');
    expect(user.password).not.toBe('password123');
    expect(await bcrypt.compare('password123', user.password)).toBe(true);
    expect(user.emailVerified).toBe(false);

    expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(email, expect.any(String));

    const token = await prisma.verificationToken.findFirst({ where: { userId: user.id } });
    expect(token).not.toBeNull();
  });

  it('register() throws ConflictException when the email is already registered', async () => {
    const email = `${uniqueTag('register-dup')}@example.test`;
    await service.register({
      name: 'Spec User',
      email,
      password: 'password123',
      firstName: 'Spec',
      lastName: 'User',
    });
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) createdUserIds.push(user.id);

    await expect(
      service.register({
        name: 'Spec User',
        email,
        password: 'password123',
        firstName: 'Spec',
        lastName: 'User',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('login() sets auth cookies for a verified user with correct credentials', async () => {
    const email = `${uniqueTag('login')}@example.test`;
    const password = 'password123';
    const user = await prisma.user.create({
      data: {
        email,
        password: await bcrypt.hash(password, 10),
        role: 'CLIENT',
        emailVerified: true,
      },
    });
    createdUserIds.push(user.id);

    const res = createMockResponse();
    const result = await service.login({ email, password }, res);

    expect(result.message).toBe('Login successful');
    expect(res.cookie).toHaveBeenCalledWith('token', expect.any(String), expect.any(Object));
    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      expect.any(String),
      expect.any(Object),
    );
  });

  it('login() throws UnauthorizedException for an incorrect password', async () => {
    const email = `${uniqueTag('login-badpass')}@example.test`;
    const user = await prisma.user.create({
      data: {
        email,
        password: await bcrypt.hash('correct-password', 10),
        role: 'CLIENT',
        emailVerified: true,
      },
    });
    createdUserIds.push(user.id);

    await expect(
      service.login({ email, password: 'wrong-password' }, createMockResponse()),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('login() throws UnauthorizedException when the email is not verified', async () => {
    const email = `${uniqueTag('login-unverified')}@example.test`;
    const password = 'password123';
    const user = await prisma.user.create({
      data: {
        email,
        password: await bcrypt.hash(password, 10),
        role: 'CLIENT',
        emailVerified: false,
      },
    });
    createdUserIds.push(user.id);

    await expect(
      service.login({ email, password }, createMockResponse()),
    ).rejects.toThrow(UnauthorizedException);
  });
});
