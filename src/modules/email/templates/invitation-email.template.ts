import { wrapInBaseTemplate } from './base-template';

export function getInvitationEmailHtml(inviteUrl: string, coachName: string): string {
  return wrapInBaseTemplate(`
    <p>Hello,</p>
    <p>Your coach, <strong>${coachName}</strong>, has invited you to join LiftForge.</p>
    <p>LiftForge is a platform designed to help you track your fitness progress, access personalized training programs, and communicate directly with your coach.</p>
    <p>To get started and connect with ${coachName}, please click the button below to register:</p>
    <a href="${inviteUrl}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background-color: #3182CE; color: white; text-decoration: none; border-radius: 4px;">
      Join LiftForge
    </a>
    <p style="margin-top: 24px; font-size: 12px;">If you didn’t expect this invitation, you can ignore this email.</p>
  `);
}
