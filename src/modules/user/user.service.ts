import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByName(name: string) {
    return this.prisma.user.findMany({
      where: { name: { contains: name, mode: 'insensitive' } },
    });
  }

  async delete(id: string) {
    try {
      console.log(id);
      return await this.prisma.user.delete({ where: { id } });
    } catch (error) {
      console.error('❌ Delete failed:', error);
      throw new InternalServerErrorException('Could not delete user');
    }
  }
}
