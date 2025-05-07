import { PrismaService } from '@/prisma/prisma.service'; // You inject PrismaService
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService, // Injecting PrismaService
    private readonly jwtService: JwtService,
  ) { }

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

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    // TypeScript knows this will return User | null
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      accessToken: await this.generateToken(user),
    };
  }

  private async generateToken(user: any): Promise<string> {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });
  }
}
