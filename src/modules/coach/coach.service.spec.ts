import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { Role } from 'generated/prisma';
import { PrismaService } from '@/prisma/prisma.service';
import { createDbTestingModule, deleteTestUser, uniqueTag } from '@/test-utils/db-test.helper';
import { EmailService } from '../email/email.service';
import { CoachService } from './coach.service';

describe('CoachService', () => {
  let module: TestingModule;
  let service: CoachService;
  let prisma: PrismaService;
  let emailService: { sendInvitationEmail: jest.Mock; sendCoachAssignmentNotification: jest.Mock };
  let userId: string | undefined;
  let inviterUserId: string | undefined;
  const createdCoachIds: string[] = [];
  const createdInvitationTokens: string[] = [];

  beforeAll(async () => {
    emailService = {
      sendInvitationEmail: jest.fn().mockResolvedValue(undefined),
      sendCoachAssignmentNotification: jest.fn().mockResolvedValue(undefined),
    };

    module = await createDbTestingModule({
      providers: [CoachService, { provide: EmailService, useValue: emailService }],
    });

    service = module.get<CoachService>(CoachService);
    prisma = module.get<PrismaService>(PrismaService);

    const [user, inviterUser] = await Promise.all([
      prisma.user.create({
        data: {
          email: `${uniqueTag('coach-owner')}@example.test`,
          password: 'not-a-real-hash',
          role: Role.COACH,
        },
      }),
      prisma.user.create({
        data: {
          email: `${uniqueTag('coach-inviter')}@example.test`,
          password: 'not-a-real-hash',
          role: Role.COACH,
        },
      }),
    ]);
    userId = user.id;
    inviterUserId = inviterUser.id;
  });

  afterAll(async () => {
    await prisma.invitation.deleteMany({ where: { token: { in: createdInvitationTokens } } });
    await prisma.coach.deleteMany({ where: { id: { in: createdCoachIds } } });
    await deleteTestUser(prisma, userId);
    await deleteTestUser(prisma, inviterUserId);
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a coach profile, finds it by id and by userId, updates it, and removes it', async () => {
    const created = await service.create({ userId: userId!, certification: 'CSCS' });
    createdCoachIds.push(created.id);

    const foundById = await service.findOne(created.id);
    expect(foundById.userId).toBe(userId);

    const foundByUserId = await service.findByUserId(userId!);
    expect(foundByUserId.id).toBe(created.id);

    const updated = await service.update(created.id, { certification: 'NASM' });
    expect(updated.certification).toBe('NASM');

    await service.remove(created.id);

    await expect(service.findOne(created.id)).rejects.toThrow(NotFoundException);
  });

  it('findOne() throws NotFoundException for a non-existent id', async () => {
    await expect(service.findOne('does-not-exist')).rejects.toThrow(NotFoundException);
  });

  it('inviteClient() creates an Invitation and emails it when the client email is unknown', async () => {
    // Uses its own coach (`inviterUserId`), independent of the create/remove roundtrip above, so
    // this test's outcome never depends on that other test having already removed its Coach row.
    const coach = await service.create({ userId: inviterUserId! });
    createdCoachIds.push(coach.id);

    const clientEmail = `${uniqueTag('invitee')}@example.test`;
    const result = await service.inviteClient(inviterUserId!, clientEmail);

    expect(result.message).toContain('Registration invitation sent');
    expect(emailService.sendInvitationEmail).toHaveBeenCalledWith(
      clientEmail,
      expect.any(String),
      expect.any(String),
    );

    const invitation = await prisma.invitation.findUnique({ where: { email: clientEmail } });
    if (!invitation) throw new Error('expected invitation to have been created');
    createdInvitationTokens.push(invitation.token);
  });
});
