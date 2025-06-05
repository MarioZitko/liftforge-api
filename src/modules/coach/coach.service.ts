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

  async inviteClient(coachId: string, clientEmail: string) {
    const coach = await this.prisma.coach.findUnique({
      where: { userId: coachId },
      include: { user: true },
    });
    if (!coach) {
      throw new NotFoundException('Coach not found');
    }

    const existingInvitation = await this.prisma.invitation.findUnique({
      where: { email: clientEmail },
    });
    if (existingInvitation) {
      throw new ConflictException('An invitation to this email already exists.');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: clientEmail },
    });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists.');
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

    return { message: 'Invitation sent successfully' };
  }
}
