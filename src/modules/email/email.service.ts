import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';
import { getVerificationEmailHtml } from './templates/verification-email.template';
import { getPasswordResetEmailHtml } from './templates/password-reset-email.template';
import { getInvitationEmailHtml } from './templates/invitation-email.template';

@Injectable()
export class EmailService {
  private resend: Resend;
  private frontendUrl: string;

  constructor(private config: ConfigService) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
    this.frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
  }

  async sendVerificationEmail(to: string, token: string) {
    const url = `${this.frontendUrl}/confirm-email?token=${token}`;
    const html = getVerificationEmailHtml(url);

    await this.resend.emails.send({
      from: 'LiftForge <onboarding@resend.dev>',
      to,
      subject: 'Verify Your Email – LiftForge',
      html,
    });
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const url = `${this.frontendUrl}/reset-password?token=${token}`;
    const html = getPasswordResetEmailHtml(url);

    await this.resend.emails.send({
      from: 'LiftForge <onboarding@resend.dev>',
      to,
      subject: 'Reset Your Password – LiftForge',
      html,
    });
  }

  async sendInvitationEmail(to: string, token: string, coachName: string) {
    const url = `${this.frontendUrl}/register?inviteToken=${token}&email=${to}`;
    const html = getInvitationEmailHtml(url, coachName);

    await this.resend.emails.send({
      from: 'LiftForge <onboarding@resend.dev>',
      to,
      subject: `You're Invited to LiftForge by ${coachName}`,
      html,
    });
  }
}
