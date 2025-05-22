import { wrapInBaseTemplate } from './base-template';

export function getPasswordResetEmailHtml(resetUrl: string): string {
  return wrapInBaseTemplate(`
    <p>You requested a password reset. Click below to choose a new one:</p>
    <a href="${resetUrl}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background-color: #E53E3E; color: white; text-decoration: none; border-radius: 4px;">
      Reset Password
    </a>
    <p style="margin-top: 24px; font-size: 12px;">If this wasn’t you, just ignore this message.</p>
  `);
}
