/**
 * Email service abstraction. Templates and provider wiring (Resend) are
 * added in Phase 19 — routes/services should only ever call sendEmail().
 */
export interface SendEmailParams {
  to: string;
  subject: string;
  react: React.ReactElement;
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  throw new Error(
    `Email service not implemented yet (Phase 19). Attempted to send "${params.subject}" to ${params.to}.`
  );
}
