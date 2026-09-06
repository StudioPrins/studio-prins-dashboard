import "server-only";

/**
 * Knipt het geciteerde antwoordgedeelte van een mail af, zodat er alleen tekst
 * overblijft die de afzender zelf schreef.
 *
 * Waarom dit ertoe doet: de stijlvoorbeelden voor de mailassistent komen uit de
 * Verzonden-map. Blijft de thread eronder staan, dan leert het model niet één
 * schrijfstijl maar die van iedereen in het gesprek — inclusief de aanhef en
 * afsluiting van de ander. In de praktijk stonden er zo zes tot acht
 * verschillende afsluitingen in één "voorbeeld".
 *
 * De vorige versie zocht alleen op de Gmail-patronen ("Op … schreef", ">"). Die
 * kwamen in een Outlook/Exchange-mailbox geen enkele keer voor: daar begint het
 * citaat met een streepjeslijn en een headerblok (`Van:` / `Verzonden:` / `Aan:`).
 * Van de 95 opgeslagen voorbeelden bevatten er 37 zo'n blok en 0 een Gmail-citaat.
 *
 * Liever te vroeg afkappen dan te laat: een half voorbeeld is nog steeds een
 * zuiver voorbeeld, maar één met de tekst van de ander erin vervuilt de stijl.
 */

/** Regels waarop we afkappen: alles vanaf hier hoort bij de vorige mail. */
const QUOTE_START: RegExp[] = [
  // Gmail / Apple Mail, in beide talen. Bewust zonder eind-anker: die regel
  // loopt vaak door op de volgende regel.
  /^\s*Op\s.+\sschreef\b/i,
  /^\s*On\s.+\swrote\b/i,
  // Outlook, klassiek.
  /^\s*-{2,}\s*(Oorspronkelijk bericht|Original Message)\s*-{2,}/i,
  // Outlook/Exchange: een streepjeslijn vlak boven het headerblok.
  /^\s*[_-]{10,}\s*$/,
  // Outlook/Exchange: het headerblok zelf, voor het geval de lijn ontbreekt.
  /^\s*(Van|From):\s*\S/i,
  // Doorgestuurde berichten.
  /^\s*-{2,}\s*(Doorgestuurd bericht|Forwarded message)\s*-{2,}/i,
];

/** Regels die we overslaan zonder de rest weg te gooien. */
const QUOTE_LINE = /^\s*>/;

export function stripQuoted(text: string): string {
  const out: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (QUOTE_START.some((re) => re.test(line))) break;
    if (QUOTE_LINE.test(line)) continue;
    out.push(line);
  }
  return out.join("\n").trim();
}
