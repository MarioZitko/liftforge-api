export function getInvitationEmailHtml(inviteUrl: string, coachName: string) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2>You're Invited to LiftForge!</h2>
      <p>Hello,</p>
      <p>Your coach, <strong>${coachName}</strong>, has invited you to join LiftForge.</p>
      <p>LiftForge is a platform designed to help you track your fitness progress, access personalized training programs, and communicate directly with your coach.</p>
      <p>To get started and connect with ${coachName}, please click the button below to register:</p>
      <p style="text-align: center;">
        <a href="${inviteUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px;">Join LiftForge</a>
      </p>
      <p>If you have any questions, please don't hesitate to reach out to your coach.</p>
      <p>Best regards,<br/>The LiftForge Team</p>
    </div>
  `;
}
