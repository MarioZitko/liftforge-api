import { wrapInBaseTemplate } from './base-template';

export function getVerificationEmailHtml(verifyUrl: string): string {
  return wrapInBaseTemplate(`
    <p>Please verify your email by clicking the button below:</p>
    <a href="${verifyUrl}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background-color: #3182CE; color: white; text-decoration: none; border-radius: 4px;">
      Verify Email
    </a>
    <p style="margin-top: 24px; font-size: 12px;">If you didn’t create a LiftForge account, you can ignore this email.</p>
  `);
}
