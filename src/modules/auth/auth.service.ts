import { EmailService } from '@/modules/email/email.service';
import { PrismaService } from '@/prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Prisma, Role } from '../../../generated/prisma';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService, // Injecting PrismaService
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: dto.role ?? Role.CLIENT,
      },
    });

    await this.requestEmailVerification(user.email);

    return {
      message: 'Registration successful. Please verify your email before logging in.',
    };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
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

  async requestEmailVerification(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException('No user found with this email');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const token = randomUUID();
    await this.prisma.verificationToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 30), // 30 minutes
      },
    });

    await this.emailService.sendVerificationEmail(email, token);
  }

  async verifyEmail(token: string) {
    const record = await this.prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired email verification token');
    }

    if (record.user.emailVerified) {
      return { message: 'Email is already verified.' };
    }

    console.log('Now:', new Date(), 'Token Expires:', record.expiresAt);

    await this.prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: true },
    });

    await this.prisma.verificationToken.deleteMany({ where: { token } });
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return; // don't reveal user existence

    const token = randomUUID();
    await this.prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 15), // 15 minutes
      },
    });

    await this.emailService.sendPasswordResetEmail(email, token);
  }

  async resetPassword(token: string, newPassword: string, modifierUserId?: string) {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: record.userId },
      data: {
        password: hashed,
      },
    });
    await this.prisma.passwordResetToken.delete({ where: { token } });
  }

  async validateRefreshToken(email: string, token: string): Promise<Prisma.UserGetPayload<{}>> {
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
