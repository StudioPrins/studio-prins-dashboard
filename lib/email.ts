import "server-only";
import { Resend } from "resend";

/**
 * E-mailverzending via Resend. Vereist RESEND_API_KEY en RESEND_FROM
 * (bv. "Studio Prins <info@studioprins.nl>"). Het domein studioprins.nl moet in
 * Resend geverifieerd zijn om vanaf info@studioprins.nl te kunnen sturen.
 */

/** Welke van de vereiste env-vars ontbreken? Leeg = alles staat klaar. */
function missingEmailEnv(): string[] {
  return (["RESEND_API_KEY", "RESEND_FROM"] as const).filter((naam) => !process.env[naam]);
}

/** Is Resend volledig geconfigureerd? */
export function isEmailConfigured(): boolean {
  return missingEmailEnv().length === 0;
}

/**
 * Foutmelding die benoemt wélke variabele ontbreekt en in wélke omgeving —
 * `.env.local` geldt alleen lokaal, dus online moet het in Vercel staan.
 */
export function emailConfigError(): string {
  const namen = missingEmailEnv();
  const onderwerp = `${namen.join(" en ")} ${namen.length > 1 ? "ontbreken" : "ontbreekt"}`;
  const omgeving = process.env.VERCEL_ENV;
  return omgeving
    ? `${onderwerp} in de Vercel-omgeving "${omgeving}". Zet de variabele daar via Settings → ` +
        "Environment Variables en deploy opnieuw; .env.local wordt online niet gelezen."
    : `${onderwerp} lokaal. Zet de variabele in .env.local en herstart de dev-server.`;
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
    throw new Error(emailConfigError());
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
