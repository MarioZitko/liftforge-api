import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientDto, UpdateClientDto, ClientWithDetailsDto } from './dto';

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateClientDto) {
    return this.prisma.client.create({ data });
  }

  async findAll(): Promise<ClientWithDetailsDto[]> {
    return this.prisma.client
      .findMany({
        include: {
          user: {
            select: {
              name: true,
              email: true,
              // emailVerified: true, // Not needed in ClientWithDetailsDto
            },
          },
        },
      })
      .then((clients) =>
        clients.map((client) => ({
          ...client,
          user: {
            ...client.user,
            name: client.user.name || null, // Ensure name is string or null
          },
        })),
      );
  }

  async findOne(id: string): Promise<ClientWithDetailsDto> {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            // emailVerified: true, // Not needed in ClientWithDetailsDto
          },
        },
      },
    });
    if (!client) throw new NotFoundException('Client not found');
    return {
      ...client,
      user: {
        ...client.user,
        name: client.user.name || null, // Ensure name is string or null
      },
    };
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
