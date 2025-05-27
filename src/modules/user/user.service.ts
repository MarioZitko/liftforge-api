import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto, UpdateUserDto } from './user.dto';
import { User } from 'generated/prisma';

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

  async create(dto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: dto.role,
      },
    });

    // Create Client or Coach profile based on role
    if (dto.role === 'CLIENT') {
      await this.prisma.client.create({
        data: {
          userId: user.id,
          // Add other client fields from dto if needed
        },
      });
    } else if (dto.role === 'COACH') {
      await this.prisma.coach.create({
        data: {
          userId: user.id,
          // Add other coach fields from dto if needed
        },
      });
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const updateData: Partial<UpdateUserDto> = {
      email: dto.email,
      name: dto.name,
      role: dto.role,
      emailVerified: dto.emailVerified,
    };

    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Optional: update extended profile data
    if (dto.role === 'CLIENT') {
      await this.prisma.client.updateMany({
        where: { userId: id },
        data: {
          // Extend with Client-specific fields if needed
        },
      });
    } else if (dto.role === 'COACH') {
      await this.prisma.coach.updateMany({
        where: { userId: id },
        data: {
          // Extend with Coach-specific fields if needed
        },
      });
    }

    return user;
  }

  async delete(id: string) {
    // Delete related Client or Coach profile if exists
    await this.prisma.client.deleteMany({ where: { userId: id } });
    await this.prisma.coach.deleteMany({ where: { userId: id } });

    return this.prisma.user.delete({ where: { id } });
  }
}
