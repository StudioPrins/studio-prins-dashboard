"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth";
import { getCompanySettings, getIntakeFields } from "@/lib/queries";
import { generateOnboardingMail } from "@/lib/welcome-mail";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { createClientFolder, isDriveConfigured } from "@/lib/google-drive";
import { publicBaseUrl } from "@/lib/site";

export type OnboardingState = { error?: string; ok?: boolean };

function str(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

/**
 * Verstuurt de onboardingmail: zorgt voor een uniek formulier-token, maakt (indien
 * geconfigureerd) een Google Drive-map aan, en mailt de klant via Resend.
 */
export async function sendOnboarding(clientId: number): Promise<OnboardingState> {
  await requireSession();

  const [client] = await db.select().from(clients).where(eq(clients.id, clientId));
  if (!client) return { error: "Klant niet gevonden." };
  if (!client.email) return { error: "Deze klant heeft geen e-mailadres. Vul dat eerst in." };
  if (!isEmailConfigured()) {
    return {
      error:
        "E-mailverzending is nog niet ingesteld. Zet RESEND_API_KEY en RESEND_FROM in de omgeving.",
    };
  }

  // 1. Token vastleggen (blijft stabiel bij opnieuw versturen).
  const token = client.onboardingToken ?? randomUUID();

  // 2. Drive-map aanmaken als die er nog niet is en Drive geconfigureerd is.
  let driveFolderId = client.driveFolderId;
  let driveFolderUrl = client.driveFolderUrl;
  if (!driveFolderId && isDriveConfigured()) {
    try {
      const folder = await createClientFolder(client.bedrijf);
      driveFolderId = folder.id;
      driveFolderUrl = folder.url;
    } catch (e) {
      return {
        error: `Google Drive-map aanmaken mislukt: ${
          e instanceof Error ? e.message : "onbekende fout"
        }`,
      };
    }
  }

  // 3. Mail samenstellen en versturen.
  const bedrijf = await getCompanySettings();
  const formUrl = `${publicBaseUrl()}/onboarding/${token}`;
  const mail = generateOnboardingMail({ client, bedrijf, formUrl, driveUrl: driveFolderUrl });

  try {
    await sendEmail({
      to: client.email,
      subject: mail.subject,
      html: mail.html,
      replyTo: bedrijf.email,
    });
  } catch (e) {
    return {
      error: `Versturen mislukt: ${e instanceof Error ? e.message : "onbekende fout"}`,
    };
  }

  // 4. Status opslaan.
  await db
    .update(clients)
    .set({
      onboardingToken: token,
      onboardingSentAt: new Date(),
      driveFolderId,
      driveFolderUrl,
    })
    .where(eq(clients.id, clientId));

  revalidatePath(`/klanten/${clientId}`);
  return { ok: true };
}

/**
 * PUBLIEK — verwerkt een ingevuld intakeformulier. Valideert het token, schrijft
 * de facturatiegegevens naar de klant en de websitewensen naar `intake`.
 * Géén sessie vereist: dit is de klantzijde.
 */
export async function submitIntake(
  token: string,
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.onboardingToken, token));
  if (!client) return { error: "Deze link is niet (meer) geldig." };

  // Websitewensen → intake-JSON. De vragen zijn beheerbaar via /instellingen,
  // dus we lezen ze uit de database in plaats van uit een constante.
  const intake: Record<string, string> = {};
  for (const f of await getIntakeFields()) {
    const v = str(formData.get(f.naam));
    if (v) intake[f.naam] = v;
  }

  await db
    .update(clients)
    .set({
      contactpersoon: str(formData.get("contactpersoon")),
      email: str(formData.get("email")),
      telefoon: str(formData.get("telefoon")),
      adres: str(formData.get("adres")),
      postcode: str(formData.get("postcode")),
      plaats: str(formData.get("plaats")),
      kvk: str(formData.get("kvk")),
      btw: str(formData.get("btw")),
      iban: str(formData.get("iban")),
      intake,
      intakeSubmittedAt: new Date(),
    })
    .where(eq(clients.id, client.id));

  revalidatePath(`/klanten/${client.id}`);
  revalidatePath("/");
  return { ok: true };
}
