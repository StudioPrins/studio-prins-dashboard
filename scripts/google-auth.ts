import { config } from "dotenv";
config({ path: [".env.local", ".env"] });
import http from "node:http";
import { google } from "googleapis";

/**
 * Haalt eenmalig een Google refresh-token op voor het Studio Prins-account.
 *
 * Vooraf (in Google Cloud Console):
 *   1. Maak/gebruik een project en zet de Google Drive API aan.
 *   2. OAuth-consent scherm: type "Extern", voeg info@studioprins.nl toe als testgebruiker.
 *   3. Maak OAuth-client (type "Webtoepassing"), en zet als "Geautoriseerde
 *      omleidings-URI": http://localhost:5599/oauth2callback
 *   4. Zet GOOGLE_CLIENT_ID en GOOGLE_CLIENT_SECRET in .env.local.
 *
 * Draaien met: npx tsx scripts/google-auth.ts
 * Log in met info@studioprins.nl, geef toestemming, en kopieer het getoonde
 * GOOGLE_REFRESH_TOKEN naar .env.local (en later naar Vercel).
 */
const PORT = 5599;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

async function main() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Zet eerst GOOGLE_CLIENT_ID en GOOGLE_CLIENT_SECRET in .env.local."
    );
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);
  const authUrl = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // forceert een refresh-token
    scope: ["https://www.googleapis.com/auth/drive"],
  });

  const server = http.createServer(async (req, res) => {
    if (!req.url?.startsWith("/oauth2callback")) {
      res.writeHead(404).end();
      return;
    }
    const code = new URL(req.url, REDIRECT_URI).searchParams.get("code");
    if (!code) {
      res.writeHead(400).end("Geen code ontvangen.");
      return;
    }
    try {
      const { tokens } = await oauth2.getToken(code);
      res
        .writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
        .end(
          "<h2>Gelukt! Je kunt dit tabblad sluiten en terug naar de terminal.</h2>"
        );
      console.log("\n✅ Refresh-token opgehaald. Zet dit in .env.local en op Vercel:\n");
      console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
      if (!tokens.refresh_token) {
        console.warn(
          "⚠️  Geen refresh_token ontvangen. Verwijder de app-toegang op https://myaccount.google.com/permissions en probeer opnieuw."
        );
      }
    } catch (e) {
      console.error("Token-uitwisseling mislukt:", e);
      res.writeHead(500).end("Er ging iets mis, zie de terminal.");
    } finally {
      server.close();
      setTimeout(() => process.exit(0), 500);
    }
  });

  server.listen(PORT, () => {
    console.log("\nOpen deze URL in je browser en log in met info@studioprins.nl:\n");
    console.log(authUrl + "\n");
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
