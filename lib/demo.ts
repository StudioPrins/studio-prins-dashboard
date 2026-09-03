/**
 * Demo-modus: een publieke, inlogloze variant van het dashboard met verzonnen
 * data, om het project te kunnen laten zien zonder echte klantgegevens.
 *
 * De harde privacygarantie zit niet in dit bestand maar in de deploy: de
 * demo-omgeving krijgt geen ANTHROPIC_API_KEY, MAIL_SECRET, RESEND_API_KEY en
 * geen Google-credentials mee. Zonder die sleutels kán er niets naar buiten,
 * ook niet als hieronder een guard ontbreekt. De vlag is er om die kale
 * env-foutmelding te vervangen door een net bericht in de UI.
 *
 * NEXT_PUBLIC_ is nodig omdat lib/uren.ts ook vanuit client-componenten wordt
 * geïmporteerd en daar dezelfde vlag moet kunnen lezen.
 */
export const DEMO = process.env.NEXT_PUBLIC_DEMO === "1";

/**
 * De sessie die in demo-modus altijd geldt; er wordt niet ingelogd.
 * Het adres komt overeen met het eerste demo-teamlid in lib/uren.ts, zodat de
 * persoonskeuze in het urenformulier net als in productie voorgevuld wordt.
 */
export const DEMO_SESSION = { email: "sanne@voorbeeldstudio.nl" } as const;

/** Nette melding bij een actie die in de demo bewust niets doet. */
export function demoMelding(wat: string): string {
  return `Niet beschikbaar in de demo: ${wat} Deze demo heeft geen mailserver- of API-koppeling, juist om er geen echte gegevens in te hebben.`;
}
