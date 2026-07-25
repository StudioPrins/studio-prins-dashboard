import type { Client } from "./db/schema";
import type { Bedrijf } from "./queries";

export type OnboardingMail = {
  subject: string;
  html: string;
  /** Platte-tekstversie (voor de kopieer-optie / fallback). */
  text: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Bouwt de onboardingmail voor een nieuwe klant: welkom + belangrijke info +
 * knoppen naar het intakeformulier en de gedeelde Google Drive-map.
 */
export function generateOnboardingMail({
  client,
  bedrijf,
  formUrl,
  driveUrl,
}: {
  client: Client;
  bedrijf: Bedrijf;
  formUrl: string;
  driveUrl?: string | null;
}): OnboardingMail {
  const naam = client.contactpersoon?.split(" ")[0] || client.bedrijf;
  const subject = `Welkom bij ${bedrijf.naam}, ${client.bedrijf}!`;

  const contact = bedrijf.telefoon
    ? `${bedrijf.email} of ${bedrijf.telefoon}`
    : bedrijf.email;

  // --- Platte tekst (kopieer-fallback) ---
  const textLines = [
    `Beste ${naam},`,
    "",
    `Wat leuk dat we samen aan de slag gaan met de website van ${client.bedrijf}! We hebben er zin in.`,
    "",
    "Om vlot te starten, vragen we je twee dingen:",
    "",
    `1. Vul het intakeformulier in. Zo krijgen we in één keer alle gegevens die we nodig hebben (bedrijfsgegevens voor de facturen én je wensen voor de website):`,
    formUrl,
    "",
  ];
  if (driveUrl) {
    textLines.push(
      `2. Zet je teksten en afbeeldingen in je persoonlijke Google Drive-map. Je hebt geen Google-account nodig, uploaden kan direct via de link:`,
      driveUrl,
      ""
    );
  }
  textLines.push(
    `Zodra we dit binnen hebben, gaan we voor je aan de slag met een eerste ontwerp. We houden je gedurende het traject op de hoogte.`,
    "",
    `Vragen? Je kunt ons altijd bereiken via ${contact}.`,
    "",
    "Met vriendelijke groet,",
    "",
    `Het team van ${bedrijf.naam}`,
    bedrijf.website
  );
  const text = textLines.join("\n");

  // --- HTML ---
  const button = (href: string, label: string) => `
    <a href="${escapeHtml(href)}" style="display:inline-block;background:#3d3ae0;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:10px;font-size:15px;">${escapeHtml(label)}</a>`;

  const driveBlock = driveUrl
    ? `
      <tr><td style="padding-top:26px;">
        <p style="margin:0 0 6px;font-weight:600;color:#17161b;">2. Lever je content aan</p>
        <p style="margin:0 0 14px;color:#4b4a55;line-height:1.6;">Zet de teksten en afbeeldingen voor je website in je persoonlijke map. Je hebt géén Google-account nodig — uploaden kan direct via de knop.</p>
        ${button(driveUrl, "Open je Drive-map")}
      </td></tr>`
    : "";

  const html = `<!doctype html>
<html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f4f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#17161b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f6;padding:28px 12px;"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e7e7ec;">
      <tr><td style="padding:28px 32px 8px;">
        <p style="margin:0;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#3d3ae0;font-weight:700;">${escapeHtml(bedrijf.naam)}</p>
      </td></tr>
      <tr><td style="padding:8px 32px 0;">
        <h1 style="margin:0 0 14px;font-size:23px;line-height:1.3;color:#17161b;">Welkom, ${escapeHtml(naam)}! 👋</h1>
        <p style="margin:0 0 16px;color:#4b4a55;line-height:1.6;">Wat leuk dat we samen aan de slag gaan met de website van <strong>${escapeHtml(client.bedrijf)}</strong>! We hebben er zin in. Om vlot te starten, vragen we je twee korte dingen.</p>
      </td></tr>
      <tr><td style="padding:8px 32px 0;">
        <p style="margin:0 0 6px;font-weight:600;color:#17161b;">1. Vul het intakeformulier in</p>
        <p style="margin:0 0 14px;color:#4b4a55;line-height:1.6;">Zo krijgen we in één keer alle gegevens die we nodig hebben: je bedrijfsgegevens voor de facturen én je wensen voor de website.</p>
        ${button(formUrl, "Vul het intakeformulier in")}
      </td></tr>
      ${driveBlock}
      <tr><td style="padding:26px 32px 0;">
        <p style="margin:0;color:#4b4a55;line-height:1.6;">Zodra we dit binnen hebben, gaan we voor je aan de slag met een eerste ontwerp. We houden je gedurende het traject op de hoogte.</p>
      </td></tr>
      <tr><td style="padding:20px 32px 28px;">
        <hr style="border:none;border-top:1px solid #e7e7ec;margin:0 0 16px;">
        <p style="margin:0;color:#8a8996;font-size:13px;line-height:1.6;">Vragen? Mail of bel ons via <a href="mailto:${escapeHtml(bedrijf.email)}" style="color:#3d3ae0;text-decoration:none;">${escapeHtml(contact)}</a>.<br>Met vriendelijke groet, het team van ${escapeHtml(bedrijf.naam)} · ${escapeHtml(bedrijf.website)}</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;

  return { subject, html, text };
}
