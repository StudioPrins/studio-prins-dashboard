"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { mailAccounts, mailStyleExamples } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth";
import { encryptSecret } from "@/lib/mail/crypto";
import {
  testImapConnection,
  fetchSentExamples,
  type ConnectionTestResult,
} from "@/lib/mail/imap";
import { verifySmtp } from "@/lib/mail/smtp";
import { distillStyleProfile } from "@/lib/ai/mail-ai";
import { DEMO, demoMelding } from "@/lib/demo";

export type FormState = { error?: string; ok?: boolean };

/**
 * Accountbeheer raakt altijd de buitenwereld: opslaan versleutelt het wachtwoord
 * met MAIL_SECRET, testen en importeren openen een IMAP-verbinding. De demo
 * heeft die sleutels niet, dus vangen we het hier af met een nette melding in
 * plaats van een kale env-fout.
 */

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}
function num(v: FormDataEntryValue | null, fallback: number): number {
  const n = Number(str(v));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
function bool(v: FormDataEntryValue | null): boolean {
  const s = str(v).toLowerCase();
  return s === "on" || s === "true" || s === "1";
}
function dateOrNull(v: FormDataEntryValue | null): Date | null {
  const s = str(v);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00+02:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Probeert (best-effort) de mappen te detecteren en op te slaan. Faalt dit,
 * dan blijft het account gewoon bestaan; de gebruiker kan later testen.
 */
async function detectAndSaveFolders(id: number, creds: {
  imapHost: string;
  imapPort: number;
  username: string;
  password: string;
}) {
  try {
    const res = await testImapConnection(creds);
    if (res.ok) {
      await db
        .update(mailAccounts)
        .set({ sentFolder: res.sentFolder ?? null, trashFolder: res.trashFolder ?? null })
        .where(eq(mailAccounts.id, id));
    }
  } catch {
    // stil: detectie is optioneel
  }
}

export async function createMailAccount(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireSession();
  if (DEMO) return { error: demoMelding("accounts opslaan vraagt een sleutel om het wachtwoord mee te versleutelen.") };

  const naam = str(formData.get("naam"));
  const email = str(formData.get("email")).toLowerCase();
  const imapHost = str(formData.get("imapHost"));
  const smtpHost = str(formData.get("smtpHost"));
  const username = str(formData.get("username")) || email;
  const password = str(formData.get("password"));

  if (!naam) return { error: "Naam is verplicht." };
  if (!email) return { error: "E-mailadres is verplicht." };
  if (!imapHost) return { error: "IMAP-host is verplicht." };
  if (!smtpHost) return { error: "SMTP-host is verplicht." };
  if (!password) return { error: "Wachtwoord is verplicht." };

  const imapPort = num(formData.get("imapPort"), 993);

  let created: { id: number };
  try {
    [created] = await db
      .insert(mailAccounts)
      .values({
        naam,
        email,
        imapHost,
        imapPort,
        smtpHost,
        smtpPort: num(formData.get("smtpPort"), 465),
        smtpSecure: bool(formData.get("smtpSecure")),
        username,
        passwordEnc: encryptSecret(password),
        sentFolder: str(formData.get("sentFolder")) || null,
        trashFolder: str(formData.get("trashFolder")) || null,
        syncSince: dateOrNull(formData.get("syncSince")),
      })
      .returning({ id: mailAccounts.id });
  } catch (err) {
    // Meest voorkomend: dubbel e-mailadres (unique constraint).
    if (err instanceof Error && /unique|duplicate/i.test(err.message)) {
      return { error: "Er bestaat al een account met dit e-mailadres." };
    }
    throw err;
  }

  // Alleen automatisch detecteren als de gebruiker niks invulde.
  if (!str(formData.get("sentFolder")) || !str(formData.get("trashFolder"))) {
    await detectAndSaveFolders(created.id, { imapHost, imapPort, username, password });
  }

  revalidatePath("/mail/instellingen");
  revalidatePath("/mail");
  return { ok: true };
}

export async function updateMailAccount(
  id: number,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireSession();
  if (DEMO) return { error: demoMelding("accounts wijzigen vraagt een sleutel om het wachtwoord mee te versleutelen.") };

  const naam = str(formData.get("naam"));
  const email = str(formData.get("email")).toLowerCase();
  const imapHost = str(formData.get("imapHost"));
  const smtpHost = str(formData.get("smtpHost"));
  const username = str(formData.get("username")) || email;
  const password = str(formData.get("password")); // leeg = behouden

  if (!naam) return { error: "Naam is verplicht." };
  if (!email) return { error: "E-mailadres is verplicht." };
  if (!imapHost) return { error: "IMAP-host is verplicht." };
  if (!smtpHost) return { error: "SMTP-host is verplicht." };

  const values: Record<string, unknown> = {
    naam,
    email,
    imapHost,
    imapPort: num(formData.get("imapPort"), 993),
    smtpHost,
    smtpPort: num(formData.get("smtpPort"), 465),
    smtpSecure: bool(formData.get("smtpSecure")),
    username,
    sentFolder: str(formData.get("sentFolder")) || null,
    trashFolder: str(formData.get("trashFolder")) || null,
    syncSince: dateOrNull(formData.get("syncSince")),
  };
  if (password) values.passwordEnc = encryptSecret(password);

  try {
    await db.update(mailAccounts).set(values).where(eq(mailAccounts.id, id));
  } catch (err) {
    if (err instanceof Error && /unique|duplicate/i.test(err.message)) {
      return { error: "Er bestaat al een account met dit e-mailadres." };
    }
    throw err;
  }

  revalidatePath("/mail/instellingen");
  revalidatePath("/mail");
  return { ok: true };
}

export async function deleteMailAccount(id: number) {
  await requireSession();
  await db.delete(mailAccounts).where(eq(mailAccounts.id, id));
  revalidatePath("/mail/instellingen");
  revalidatePath("/mail");
}

export type TestResult = ConnectionTestResult & { smtpOk?: boolean; smtpError?: string };

/**
 * Test IMAP + SMTP voor een opgeslagen account en bewaart gedetecteerde mappen
 * als die nog niet handmatig zijn ingesteld.
 */
export async function testMailAccountAction(id: number): Promise<TestResult> {
  await requireSession();
  if (DEMO) return { ok: false, error: demoMelding("de verbindingstest belt een echte mailserver.") };
  const [account] = await db.select().from(mailAccounts).where(eq(mailAccounts.id, id));
  if (!account) return { ok: false, error: "Account niet gevonden." };

  const { decryptSecret } = await import("@/lib/mail/crypto");
  const password = decryptSecret(account.passwordEnc);

  const imap = await testImapConnection({
    imapHost: account.imapHost,
    imapPort: account.imapPort,
    username: account.username,
    password,
  });
  const smtp = await verifySmtp({
    smtpHost: account.smtpHost,
    smtpPort: account.smtpPort,
    smtpSecure: account.smtpSecure,
    username: account.username,
    password,
  });

  // Ontdekte mappen bewaren als ze nog leeg waren.
  if (imap.ok && (!account.sentFolder || !account.trashFolder)) {
    await db
      .update(mailAccounts)
      .set({
        sentFolder: account.sentFolder ?? imap.sentFolder ?? null,
        trashFolder: account.trashFolder ?? imap.trashFolder ?? null,
      })
      .where(eq(mailAccounts.id, id));
    revalidatePath("/mail/instellingen");
  }

  return { ...imap, smtpOk: smtp.ok, smtpError: smtp.error };
}

export type ImportResult = { ok: boolean; error?: string; count?: number };

/**
 * Haalt (opnieuw) tot 50 verzonden mails op als stijlvoorbeelden, vervangt de
 * bestaande set en distilleert er een compact stijlprofiel uit. Herdraaibaar.
 */
export async function importSentMails(id: number): Promise<ImportResult> {
  await requireSession();
  if (DEMO) return { ok: false, error: demoMelding("stijl importeren leest je Verzonden-map uit via IMAP.") };
  const [account] = await db.select().from(mailAccounts).where(eq(mailAccounts.id, id));
  if (!account) return { ok: false, error: "Account niet gevonden." };
  if (!account.sentFolder) {
    return {
      ok: false,
      error:
        "Geen Verzonden-map bekend. Test eerst de verbinding of stel de map handmatig in.",
    };
  }

  let examples;
  try {
    examples = await fetchSentExamples(account, 50);
  } catch (err) {
    return {
      ok: false,
      error: `Ophalen mislukt: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (examples.length === 0) {
    return { ok: false, error: "Geen bruikbare verzonden mails gevonden." };
  }

  // Oude voorbeelden vervangen.
  await db.delete(mailStyleExamples).where(eq(mailStyleExamples.accountId, id));
  await db.insert(mailStyleExamples).values(
    examples.map((e) => ({
      accountId: id,
      toAddress: e.toAddress,
      subject: e.subject,
      bodyText: e.bodyText,
      date: e.date,
    }))
  );

  // Stijlprofiel distilleren (best-effort; faalt dit, dan bewaren we wel de voorbeelden).
  let styleProfile: string | null = null;
  try {
    styleProfile = (await distillStyleProfile(examples)) || null;
  } catch {
    styleProfile = null;
  }

  await db
    .update(mailAccounts)
    .set({ styleProfile, styleImportedAt: new Date() })
    .where(eq(mailAccounts.id, id));

  revalidatePath("/mail/instellingen");
  return { ok: true, count: examples.length };
}
