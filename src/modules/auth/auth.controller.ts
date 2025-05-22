// src/modules/auth/auth.controller.ts
import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RequestEmailVerificationDto } from './dto/request-email-verification.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Throttle } from '@nestjs/throttler';
import { Response, Request } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
@Throttle({ default: { limit: 5, ttl: 60 } })
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(dto, res);
  }

  @Post('refresh')
  async refreshToken(@Body() dto: { email: string; refreshToken: string }) {
    return this.authService.validateRefreshToken(dto.email, dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: { userId: string; email: string; role: string }) {
    return user;
  }

  @Post('request-password-reset')
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  @UseGuards(JwtAuthGuard)
  async resetPassword(@Body() dto: ResetPasswordDto, @CurrentUser() user?: { userId: string }) {
    return this.authService.resetPassword(dto.token, dto.newPassword, user?.userId);
  }

  @Post('request-email-verification')
  async requestEmailVerification(@Body() dto: RequestEmailVerificationDto) {
    return this.authService.requestEmailVerification(dto.email);
  }

  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token');
    res.clearCookie('refreshToken');
    return { message: 'Logged out' };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // handled by passport
  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleRedirect(@Req() req: Request, @Res() res: Response) {
    if (!req.user || typeof req.user !== 'object' || !('email' in req.user)) {
      return res.status(400).send('OAuth user info not found');
    }
    const { email, name } = req.user as { email: string; name?: string };
    await this.authService.loginOAuthUser({ email, name }, res);
    return res.redirect(`${process.env.FRONTEND_URL}/oauth-callback`);
  }

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookRedirect(@Req() req: Request, @Res() res: Response) {
    if (!req.user || typeof req.user !== 'object' || !('email' in req.user)) {
      return res.status(400).send('OAuth user info not found');
    }
    const { email, name } = req.user as { email: string; name?: string };
    await this.authService.loginOAuthUser({ email, name }, res);
    return res.redirect(`${process.env.FRONTEND_URL}/oauth-callback`);
  }
}
