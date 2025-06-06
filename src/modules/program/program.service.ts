import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';

@Injectable()
export class ProgramService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateProgramDto) {
    return this.prisma.program.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.program.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const program = await this.prisma.program.findUnique({ where: { id } });
    if (!program) throw new NotFoundException('Program not found');
    return program;
  }

  async findForCoach(userId: string, onlyMine: boolean) {
    return this.prisma.program.findMany({
      where: onlyMine
        ? { createdById: userId }
        : {
            OR: [{ createdById: null }, { createdById: userId }],
          },
      orderBy: { name: 'asc' },
    });
  }

  async update(id: number, data: UpdateProgramDto) {
    return this.prisma.program.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.program.delete({ where: { id } });
  }
}
