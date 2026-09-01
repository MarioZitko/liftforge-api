import {
  assertClientProgramAccess,
  assertNoReparenting,
  RequestingUser,
} from '@/common/auth/ownership.util';
import { resolveClientId, resolveCoachId } from '@/common/scoped-query.util';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateClientProgramDto } from './dto/create-client-program.dto';
import { UpdateClientProgramDto } from './dto/update-client-program.dto';

const clientProgramIncludes = {
  program: true,
  client: {
    include: {
      user: { select: { name: true, email: true } },
    },
  },
};

@Injectable()
export class ClientProgramService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateClientProgramDto) {
    return this.prisma.clientProgram.create({
      data,
      include: clientProgramIncludes,
    });
  }

  async findAll() {
    return this.prisma.clientProgram.findMany({
      orderBy: { name: 'asc' },
      include: clientProgramIncludes,
    });
  }

  async findOne(id: number, user: RequestingUser) {
    const clientProgram = await this.prisma.clientProgram.findUnique({
      where: { id },
      include: clientProgramIncludes,
    });
    if (!clientProgram) throw new NotFoundException('Client Program not found');
    await assertClientProgramAccess(this.prisma, clientProgram, user);
    return clientProgram;
  }

  async findForCoach(userId: string) {
    const coachId = await resolveCoachId(this.prisma, userId);
    if (!coachId) return [];
    return this.prisma.clientProgram.findMany({
      where: { coachId },
      orderBy: { name: 'asc' },
      include: clientProgramIncludes,
    });
  }

  async findForClient(userId: string) {
    const clientId = await resolveClientId(this.prisma, userId);
    if (!clientId) return [];
    return this.prisma.clientProgram.findMany({
      where: { clientId },
      orderBy: { name: 'asc' },
      include: { program: true },
    });
  }

  async update(id: number, data: UpdateClientProgramDto, user: RequestingUser) {
    const existing = await this.prisma.clientProgram.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Client Program not found');
    await assertClientProgramAccess(this.prisma, existing, user);
    assertNoReparenting('clientId', data.clientId, existing.clientId, user);
    assertNoReparenting('programId', data.programId, existing.programId, user);
    assertNoReparenting('coachId', data.coachId, existing.coachId, user);
    return this.prisma.clientProgram.update({
      where: { id },
      data,
      include: clientProgramIncludes,
    });
  }

  async remove(id: number, user: RequestingUser) {
    const existing = await this.prisma.clientProgram.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Client Program not found');
    await assertClientProgramAccess(this.prisma, existing, user);
    return this.prisma.clientProgram.delete({ where: { id } });
  }
}
