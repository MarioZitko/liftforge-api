import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCoachDto, UpdateCoachDto } from './dto';
import { EmailService } from '../email/email.service';
import { randomUUID } from 'crypto';

@Injectable()
export class CoachService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async create(data: CreateCoachDto) {
    return this.prisma.coach.create({ data });
  }

  async findAll() {
    return this.prisma.coach.findMany();
  }

  async findOne(id: string) {
    const coach = await this.prisma.coach.findUnique({ where: { id } });
    if (!coach) throw new NotFoundException('Coach not found');
    return coach;
  }

  async update(id: string, data: UpdateCoachDto) {
    return this.prisma.coach.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.coach.delete({ where: { id } });
  }

  async getCoachClients(id: string) {
    const coach = await this.prisma.coach.findUnique({
      where: { id },
      include: { clients: true },
    });
    if (!coach) throw new NotFoundException('Coach not found');
    return coach.clients;
  }

  async inviteClient(coachUserId: string, clientEmail: string) {
    const coach = await this.prisma.coach.findUnique({
      where: { userId: coachUserId },
      include: { user: true },
    });
    if (!coach) {
      throw new NotFoundException('Coach not found');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: clientEmail },
      include: { client: true }, // Include client relation to check if they have a coach
    });

    if (existingUser) {
      // User exists, now check their client status
      if (existingUser.client && existingUser.client.coachId) {
        throw new ConflictException('This client is already assigned to a coach.');
      }

      // If user exists and either no client record or client record without coachId
      // Assign the coach directly on the backend
      if (existingUser.client) {
        // Client record exists, update coachId
        await this.prisma.client.update({
          where: { id: existingUser.client.id },
          data: { coachId: coach.id },
        });
      } else {
        // No client record for this user, create one and assign coachId
        await this.prisma.client.create({
          data: {
            userId: existingUser.id,
            coachId: coach.id,
          },
        });
      }

      // Send a notification email for direct assignment (no registration link)
      await this.emailService.sendCoachAssignmentNotification(
        clientEmail,
        coach.user.name || 'Your Coach',
      );

      return { message: `Client ${clientEmail} has been directly assigned to you.` };
    } else {
      // User does not exist, proceed with existing registration invitation flow
      const existingInvitation = await this.prisma.invitation.findUnique({
        where: { email: clientEmail },
      });
      if (existingInvitation) {
        throw new ConflictException('An invitation to this email already exists.');
      }

      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days expiration

      await this.prisma.invitation.create({
        data: {
          email: clientEmail,
          token,
          coachId: coach.id,
          expiresAt,
        },
      });

      await this.emailService.sendInvitationEmail(
        clientEmail,
        token,
        coach.user.name || 'Your Coach',
      );

      return { message: 'Registration invitation sent successfully' };
    }
  }
}
