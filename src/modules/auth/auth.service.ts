import { PrismaService } from '@/prisma/prisma.service'; // You inject PrismaService
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { randomUUID } from 'crypto';
import { User } from 'generated/prisma';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService, // Injecting PrismaService
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ accessToken: string }> {
    // TypeScript knows the result will be User | null here due to Prisma's types
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Similarly, TypeScript knows this will return a User
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
      },
    });

    return {
      accessToken: await this.generateToken(user),
    };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.generateToken(user);
    const rawRefreshToken = randomUUID(); // you could also use jwt for refresh token

    const hashedRefreshToken = await bcrypt.hash(rawRefreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { hashedRefreshToken },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  async validateRefreshToken(email: string, token: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('Refresh token invalid');
    }

    const isValid = await bcrypt.compare(token, user.hashedRefreshToken);
    if (!isValid) throw new UnauthorizedException('Refresh token invalid');

    return user;
  }

  async generateToken(user: any): Promise<string> {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }
}
