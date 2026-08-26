import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';

const sendMock = jest.fn().mockResolvedValue({ data: { id: 'email-id' }, error: null });

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: sendMock },
  })),
}));

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    sendMock.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === 'FRONTEND_URL' ? 'http://localhost:5173' : 'test-resend-api-key',
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('sendVerificationEmail() sends an email containing the verification link', async () => {
    await service.sendVerificationEmail('client@example.test', 'verify-token');

    expect(sendMock).toHaveBeenCalledTimes(1);
    const payload = sendMock.mock.calls[0][0];
    expect(payload.to).toBe('client@example.test');
    expect(payload.subject).toContain('Verify Your Email');
    expect(payload.html).toContain('http://localhost:5173/confirm-email?token=verify-token');
  });

  it('sendPasswordResetEmail() sends an email containing the reset link', async () => {
    await service.sendPasswordResetEmail('client@example.test', 'reset-token');

    expect(sendMock).toHaveBeenCalledTimes(1);
    const payload = sendMock.mock.calls[0][0];
    expect(payload.html).toContain('http://localhost:5173/reset-password?token=reset-token');
  });
});
