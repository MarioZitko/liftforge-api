import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateClientProgramDto } from './dto/create-client-program.dto';
import { UpdateClientProgramDto } from './dto/update-client-program.dto';

@Injectable()
export class ClientProgramService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateClientProgramDto) {
    return this.prisma.clientProgram.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.clientProgram.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const clientProgram = await this.prisma.clientProgram.findUnique({ where: { id } });
    if (!clientProgram) throw new NotFoundException('Client Program not found');
    return clientProgram;
  }

  async findForCoach(userId: string) {
    return this.prisma.clientProgram.findMany({
      where: { coachId: userId },
      orderBy: { name: 'asc' },
    });
  }

  async update(id: number, data: UpdateClientProgramDto) {
    return this.prisma.clientProgram.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.clientProgram.delete({ where: { id } });
  }
}
