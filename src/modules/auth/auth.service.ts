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
import { Response } from 'express';
import { Role } from 'generated/prisma/client';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { setAuthCookies } from './helpers/set-auth-cookies';
import { AuthenticatedRequest } from './interfaces/auth-request.interface';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly userService: UserService,
  ) {}

  async register(dto: RegisterDto, inviteToken?: string): Promise<{ message: string }> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('User already exists');

    let coachId: string | undefined;
    if (inviteToken) {
      const invitation = await this.prisma.invitation.findUnique({
        where: { token: inviteToken },
      });

      if (!invitation || invitation.expiresAt < new Date() || invitation.email !== dto.email) {
        throw new BadRequestException('Invalid or expired invitation token');
      }
      coachId = invitation.coachId;

      // Delete the invitation after successful registration
      await this.prisma.invitation.delete({ where: { token: inviteToken } });
    }

    const user = await this.userService.create({
      email: dto.email,
      password: dto.password,
      name: dto.name,
      role: dto.role ?? Role.CLIENT,
    });

    if (coachId) {
      await this.prisma.client.update({
        where: { userId: user.id },
        data: { coachId, lookingForCoach: false },
      });
    }

    await this.requestEmailVerification(user.email);
    return { message: 'Registration successful. Please verify your email before logging in.' };
  }

  async login(dto: LoginDto, res: Response): Promise<{ message: string }> {
    const user = await this.validateUser(dto.email, dto.password);
    const accessToken = await this.generateToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    setAuthCookies(res, accessToken, refreshToken);
    return { message: 'Login successful' };
  }

  async loginOAuthUser(profile: { email: string; name?: string }, res: Response) {
    const email = profile.email;
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      // ⚠️ Do NOT create yet — wait for frontend to call /auth/oauth-finalize
      res.cookie('pending_oauth_email', email, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 5, // 5 min
      });

      return res.redirect(`${process.env.FRONTEND_URL}/oauth-finalize`);
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    const accessToken = await this.generateToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    setAuthCookies(res, accessToken, refreshToken);
    return res.redirect(`${process.env.FRONTEND_URL}/oauth-callback`);
  }

  private async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    return user;
  }

  private async generateRefreshToken(user: any): Promise<string> {
    const rawToken = randomUUID();
    const hashed = await bcrypt.hash(rawToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { hashedRefreshToken: hashed },
    });
    return rawToken;
  }

  async requestEmailVerification(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('No user found with this email');
    if (user.emailVerified) throw new BadRequestException('Email is already verified');

    const token = randomUUID();
    await this.prisma.verificationToken.create({
      data: { token, userId: user.id, expiresAt: new Date(Date.now() + 1000 * 60 * 30) },
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

    if (!record.user.emailVerified) {
      await this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true },
      });
    }

    await this.prisma.verificationToken.deleteMany({ where: { token } });
    return { message: 'Email verified successfully' };
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return;

    const token = randomUUID();
    await this.prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt: new Date(Date.now() + 1000 * 60 * 15) },
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

  async refreshTokens(res: Response, refreshToken: string): Promise<{ message: string }> {
    const users = await this.prisma.user.findMany({
      where: { hashedRefreshToken: { not: null } },
    });

    for (const user of users) {
      if (!user.hashedRefreshToken) continue;

      const isValid = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
      if (isValid) {
        const accessToken = await this.generateToken(user);
        const newRefreshToken = await this.generateRefreshToken(user);
        setAuthCookies(res, accessToken, newRefreshToken);
        return { message: 'Token refreshed' };
      }
    }

    throw new UnauthorizedException('Invalid refresh token');
  }

  private async generateToken(user: any): Promise<string> {
    return this.jwtService.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: '15m' },
    );
  }

  async getUserFromRefreshToken(token: string) {
    const users = await this.prisma.user.findMany({
      where: { hashedRefreshToken: { not: null } },
    });

    for (const user of users) {
      if (!user.hashedRefreshToken) continue;

      const isValid = await bcrypt.compare(token, user.hashedRefreshToken);
      if (isValid) return user;
    }

    throw new UnauthorizedException('User not found for refresh token');
  }

  async handleOAuthRedirect(req: AuthenticatedRequest, res: Response) {
    if (!req.user?.email) {
      return res.status(400).send('OAuth user info not found');
    }

    const { email, name } = req.user;
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.cookie('pending_oauth_email', email, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 5, // 5 min
      });

      return res.redirect(`${process.env.FRONTEND_URL}/oauth-finalize`);
    }

    const accessToken = await this.generateToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    setAuthCookies(res, accessToken, refreshToken);
    return res.redirect(`${process.env.FRONTEND_URL}/oauth-callback`);
  }

  async finalizeOAuth(req: AuthenticatedRequest, res: Response, role: Role, name: string) {
    const email = req.cookies['pending_oauth_email'];
    if (!email) throw new BadRequestException('OAuth session expired');

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('User already exists');

    const user = await this.userService.create({
      email,
      name: name,
      password: '', // no password for OAuth users
      role,
      emailVerified: true,
    });

    res.clearCookie('pending_oauth_email');

    const accessToken = await this.generateToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    setAuthCookies(res, accessToken, refreshToken);
    return { message: 'OAuth account finalized' };
  }
}
