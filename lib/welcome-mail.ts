import { BEDRIJF } from "./bedrijf";
import type { Client } from "./db/schema";

/** Genereert een kant-en-klare welkomstmail voor een nieuwe klant. */
export function generateWelcomeMail(client: Client): { subject: string; body: string } {
  const naam = client.contactpersoon?.split(" ")[0] || client.bedrijf;
  const subject = `Welkom bij ${BEDRIJF.naam}, ${client.bedrijf}!`;

  const body = `Beste ${naam},

Wat leuk dat we samen aan de slag gaan met de website van ${client.bedrijf}! We hebben er zin in.

Om vlot te starten, zouden we graag het volgende van jullie ontvangen:
• Teksten en/of belangrijkste boodschap voor de website
• Logo en eventueel huisstijl (kleuren, lettertypes)
• Beeldmateriaal (foto's van het bedrijf, team of producten)
• Voorbeelden van websites die jullie mooi vinden

Zodra we dit binnen hebben, gaan we voor jullie aan de slag met een eerste ontwerp. We houden jullie gedurende het traject op de hoogte en plannen een korte feedbackronde in.

Heb je tussendoor vragen? Je kunt ons altijd bereiken via ${BEDRIJF.email}${
    BEDRIJF.telefoon ? ` of ${BEDRIJF.telefoon}` : ""
  }.

Met vriendelijke groet,

Het team van ${BEDRIJF.naam}
${BEDRIJF.website}`;

  return { subject, body };
}
