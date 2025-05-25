import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCoachDto, UpdateCoachDto } from './dto';

@Injectable()
export class CoachService {
  constructor(private readonly prisma: PrismaService) { }

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
}
