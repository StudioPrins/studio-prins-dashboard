/**
 * Publieke basis-URL van het dashboard, voor het bouwen van deelbare links
 * (zoals het intakeformulier). Zet APP_BASE_URL in de omgeving voor een vaste
 * waarde; anders valt het terug op de Vercel-productie-URL of localhost.
 */
export function publicBaseUrl(): string {
  return (
    process.env.APP_BASE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000")
  );
}
