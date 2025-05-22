export function wrapInBaseTemplate(content: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <header style="text-align: center; padding-bottom: 16px; border-bottom: 1px solid #e0e0e0;">
        <h1 style="margin: 0; color: #3182CE;">LiftForge</h1>
        <p style="margin: 4px 0; font-size: 14px; color: #718096;">Train smart. Lift stronger.</p>
      </header>
      ${content}
      <footer style="margin-top: 24px; font-size: 12px; color: #A0AEC0; text-align: center;">
        © ${new Date().getFullYear()} LiftForge. All rights reserved.
      </footer>
    </div>
  `;
}
