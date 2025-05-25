import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientDto, UpdateClientDto } from './dto';

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) { }

  async create(data: CreateClientDto) {
    return this.prisma.client.create({ data });
  }

  async findAll() {
    return this.prisma.client.findMany();
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async update(id: string, data: UpdateClientDto) {
    return this.prisma.client.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.client.delete({ where: { id } });
  }

  async getClientPrograms(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: { clientPrograms: true },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client.clientPrograms;
  }
}