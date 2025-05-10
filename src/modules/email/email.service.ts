import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor(private config: ConfigService) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
  }

  async sendVerificationEmail(to: string, token: string) {
    const url = `https://your-frontend.com/verify-email?token=${token}`;

    await this.resend.emails.send({
      from: 'LiftForge <noreply@liftforge.dev>',
      to,
      subject: 'Verify your email – LiftForge',
      html: `<p>Click <a href="${url}">here</a> to verify your email.</p>`,
    });
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const url = `https://your-frontend.com/reset-password?token=${token}`;

    await this.resend.emails.send({
      from: 'LiftForge <noreply@liftforge.dev>',
      to,
      subject: 'Reset your password – LiftForge',
      html: `<p>Reset your password <a href="${url}">here</a>.</p>`,
    });
  }
}
