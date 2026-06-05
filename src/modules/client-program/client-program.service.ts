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

  async findOne(id: number) {
    const clientProgram = await this.prisma.clientProgram.findUnique({
      where: { id },
      include: clientProgramIncludes,
    });
    if (!clientProgram) throw new NotFoundException('Client Program not found');
    return clientProgram;
  }

  async findForCoach(userId: string) {
    const coach = await this.prisma.coach.findUnique({ where: { userId } });
    if (!coach) return [];
    return this.prisma.clientProgram.findMany({
      where: { coachId: coach.id },
      orderBy: { name: 'asc' },
      include: clientProgramIncludes,
    });
  }

  async findForClient(userId: string) {
    const client = await this.prisma.client.findUnique({ where: { userId } });
    if (!client) return [];
    return this.prisma.clientProgram.findMany({
      where: { clientId: client.id },
      orderBy: { name: 'asc' },
      include: { program: true },
    });
  }

  async update(id: number, data: UpdateClientProgramDto) {
    return this.prisma.clientProgram.update({
      where: { id },
      data,
      include: clientProgramIncludes,
    });
  }

  async remove(id: number) {
    return this.prisma.clientProgram.delete({ where: { id } });
  }
}
