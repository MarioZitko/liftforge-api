// src/modules/auth/auth.controller.ts
import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { Role } from 'generated/prisma/client';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestEmailVerificationDto } from './dto/request-email-verification.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthenticatedRequest } from './interfaces/auth-request.interface';

@Controller('auth')
@Throttle({ default: { limit: 5, ttl: 60 } })
export class AuthController {
  constructor(private authService: AuthService) { }

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
  async googleRedirect(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    return this.authService.handleOAuthRedirect(req, res);
  }

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  facebookLogin() {
    // Passport handles the redirect to Facebook
  }

  @Get('facebook/redirect')
  @UseGuards(AuthGuard('facebook'))
  async facebookRedirect(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    return this.authService.handleOAuthRedirect(req, res);
  }

  @Post('oauth-finalize')
  async finalizeOAuth(
    @Res({ passthrough: true }) res: Response,
    @Body() dto: { name: string; role: Role },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.authService.finalizeOAuth(req, res, dto.role, dto.name);
  }
}
