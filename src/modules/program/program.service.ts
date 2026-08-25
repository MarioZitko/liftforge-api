import { assertProgramAccess, RequestingUser } from '@/common/auth/ownership.util';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';

@Injectable()
export class ProgramService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateProgramDto, userId: string) {
    const { name, description, isPublic } = data;
    return this.prisma.program.create({
      data: { name, description, isPublic, createdById: userId },
    });
  }

  async findAll() {
    return this.prisma.program.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number, user: RequestingUser) {
    const program = await this.prisma.program.findUnique({ where: { id } });
    if (!program) throw new NotFoundException('Program not found');
    await assertProgramAccess(this.prisma, { programId: program.id }, user);
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

  async update(id: number, data: UpdateProgramDto, user: RequestingUser) {
    const program = await this.prisma.program.findUnique({ where: { id } });
    if (!program) throw new NotFoundException('Program not found');
    await assertProgramAccess(this.prisma, { programId: program.id }, user);
    return this.prisma.program.update({
      where: { id },
      data: { ...data, updatedById: user.userId },
    });
  }

  async remove(id: number, user: RequestingUser) {
    const program = await this.prisma.program.findUnique({ where: { id } });
    if (!program) throw new NotFoundException('Program not found');
    await assertProgramAccess(this.prisma, { programId: program.id }, user);
    return this.prisma.program.delete({ where: { id } });
  }
}
