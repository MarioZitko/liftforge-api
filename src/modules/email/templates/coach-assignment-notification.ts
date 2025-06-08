export function getCoachAssignmentNotificationHtml(
  dashboardUrl: string,
  coachName: string,
): string {
  return `
      <p>Hello,</p>
      <p>Good news! Your coach, ${coachName}, has assigned you to their client roster on LiftForge.</p>
      <p>You can now log in and access your dashboard to see updates and get started.</p>
      <p><a href="${dashboardUrl}">Go to Dashboard</a></p>
      <p>Best regards,</p>
      <p>The LiftForge Team</p>
    `;
}
