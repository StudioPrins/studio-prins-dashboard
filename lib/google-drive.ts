import "server-only";
import { google } from "googleapis";

/**
 * Google Drive-koppeling voor het automatisch aanmaken van een klantmap.
 * Gebruikt OAuth2 met een refresh-token van het Studio Prins Google-account
 * (info@studioprins.nl). Zie scripts/google-auth.ts om het token op te halen.
 */

export type DriveFolder = { id: string; url: string };

function driveClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Google Drive is niet geconfigureerd. Zet GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET en GOOGLE_REFRESH_TOKEN in de omgeving."
    );
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });
  return google.drive({ version: "v3", auth });
}

/** Is de Drive-koppeling volledig geconfigureerd? */
export function isDriveConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN
  );
}

/**
 * Maakt een gedeelde map voor een klant onder de bovenliggende map
 * (GOOGLE_DRIVE_PARENT_FOLDER_ID). Iedereen met de link mag uploaden, zodat de
 * klant zonder Google-account teksten en afbeeldingen kan aanleveren.
 */
export async function createClientFolder(bedrijf: string): Promise<DriveFolder> {
  const drive = driveClient();
  const parent = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;

  const created = await drive.files.create({
    // supportsAllDrives zodat het ook binnen een Gedeelde Drive werkt.
    supportsAllDrives: true,
    requestBody: {
      name: `${bedrijf} — Studio Prins`,
      mimeType: "application/vnd.google-apps.folder",
      ...(parent ? { parents: [parent] } : {}),
    },
    fields: "id, webViewLink",
  });

  const id = created.data.id;
  if (!id) throw new Error("Google Drive gaf geen map-ID terug.");

  // Iedereen met de link mag bewerken/uploaden.
  await drive.permissions.create({
    fileId: id,
    supportsAllDrives: true,
    requestBody: { type: "anyone", role: "writer" },
  });

  const url =
    created.data.webViewLink ?? `https://drive.google.com/drive/folders/${id}`;
  return { id, url };
}
