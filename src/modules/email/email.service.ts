import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';
import { getVerificationEmailHtml } from './templates/verification-email.template';
import { getPasswordResetEmailHtml } from './templates/password-reset-email.template';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor(private config: ConfigService) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
  }

  async sendVerificationEmail(to: string, token: string) {
    const url = `https://your-frontend.com/verify-email?token=${token}`;
    const html = getVerificationEmailHtml(url);

    await this.resend.emails.send({
      from: 'LiftForge <onboarding@resend.dev>',
      to,
      subject: 'Verify Your Email – LiftForge',
      html,
    });
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const url = `https://your-frontend.com/reset-password?token=${token}`;
    const html = getPasswordResetEmailHtml(url);

    await this.resend.emails.send({
      from: 'LiftForge <onboarding@resend.dev>',
      to,
      subject: 'Reset Your Password – LiftForge',
      html,
    });
  }
}
