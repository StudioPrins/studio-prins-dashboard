import "server-only";
import { Resend } from "resend";

/**
 * E-mailverzending via Resend. Vereist RESEND_API_KEY en RESEND_FROM
 * (bv. "Studio Prins <info@studioprins.nl>"). Het domein studioprins.nl moet in
 * Resend geverifieerd zijn om vanaf info@studioprins.nl te kunnen sturen.
 */

/** Is Resend volledig geconfigureerd? */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) {
    throw new Error(
      "E-mail is niet geconfigureerd. Zet RESEND_API_KEY en RESEND_FROM in de omgeving."
    );
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  });

  if (error) {
    throw new Error(`Versturen mislukt (Resend): ${error.message}`);
  }
}
