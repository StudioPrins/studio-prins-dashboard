"use server";

import { and, asc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { mailAccounts, mailMessages, mailStyleExamples } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth";
import { runMailSync, type MailSyncResult } from "@/lib/mail/sync";
import { markSeen, moveToTrash, appendToSent } from "@/lib/mail/imap";
import { sendReply } from "@/lib/mail/smtp";
import { generateDraft } from "@/lib/ai/mail-ai";

export type SendState = { error?: string; ok?: boolean; warning?: string };

/* --- Synchroniseren -------------------------------------------------------- */

export async function syncNowAction(): Promise<MailSyncResult> {
  await requireSession();
  const result = await runMailSync();
  revalidatePath("/mail");
  return result;
}

/* --- Concept genereren ----------------------------------------------------- */

export type DraftState = { error?: string; ok?: boolean; draft?: string };

export async function generateDraftAction(messageId: number): Promise<DraftState> {
  await requireSession();
  const [msg] = await db.select().from(mailMessages).where(eq(mailMessages.id, messageId));
  if (!msg) return { error: "Mail niet gevonden." };
  const [account] = await db.select().from(mailAccounts).where(eq(mailAccounts.id, msg.accountId));
  if (!account) return { error: "Account niet gevonden." };

  const examples = await db
    .select({ subject: mailStyleExamples.subject, bodyText: mailStyleExamples.bodyText })
    .from(mailStyleExamples)
    .where(eq(mailStyleExamples.accountId, account.id))
    .orderBy(asc(mailStyleExamples.id));

  try {
    const draft = await generateDraft(
      account,
      {
        fromName: msg.fromName,
        fromAddress: msg.fromAddress,
        subject: msg.subject,
        date: msg.date,
        bodyText: msg.bodyText,
      },
      examples
    );
    await db
      .update(mailMessages)
      .set({ aiDraft: draft, aiDraftGeneratedAt: new Date() })
      .where(eq(mailMessages.id, messageId));
    revalidatePath("/mail");
    return { ok: true, draft };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

/* --- Antwoord versturen ---------------------------------------------------- */

export async function sendReplyAction(
  messageId: number,
  _prev: SendState,
  formData: FormData
): Promise<SendState> {
  await requireSession();
  const body = typeof formData.get("body") === "string" ? (formData.get("body") as string).trim() : "";
  if (!body) return { error: "Het antwoord is leeg." };

  const [msg] = await db.select().from(mailMessages).where(eq(mailMessages.id, messageId));
  if (!msg) return { error: "Mail niet gevonden." };
  const [account] = await db.select().from(mailAccounts).where(eq(mailAccounts.id, msg.accountId));
  if (!account) return { error: "Account niet gevonden." };

  // 1. Versturen via SMTP (harde fout als dit mislukt).
  let raw: Buffer;
  try {
    ({ raw } = await sendReply(
      account,
      {
        fromAddress: msg.fromAddress,
        subject: msg.subject,
        messageId: msg.messageId,
        references: msg.references,
      },
      body
    ));
  } catch (err) {
    return { error: `Versturen mislukt: ${err instanceof Error ? err.message : String(err)}` };
  }

  // 2. Kopie in Verzonden-map + origineel als gelezen markeren. Faalt dit ná een
  //    geslaagde verzending, dan is de mail wél verstuurd: status toch beantwoord,
  //    met een waarschuwing (voorkomt dubbel versturen bij een retry).
  let warning: string | undefined;
  try {
    await appendToSent(account, raw);
  } catch (err) {
    warning = `Verzonden, maar kopie in Verzonden-map mislukte: ${err instanceof Error ? err.message : String(err)}`;
  }
  try {
    if (msg.uid) await markSeen(account, msg.uid);
  } catch {
    // niet kritiek
  }

  await db
    .update(mailMessages)
    .set({ status: "beantwoord", aiDraft: body })
    .where(eq(mailMessages.id, messageId));
  revalidatePath("/mail");
  return { ok: true, warning };
}

/* --- Verwijderen / negeren ------------------------------------------------- */

export async function deleteMessageAction(messageId: number): Promise<void> {
  await requireSession();
  const [msg] = await db.select().from(mailMessages).where(eq(mailMessages.id, messageId));
  if (!msg) return;
  const [account] = await db.select().from(mailAccounts).where(eq(mailAccounts.id, msg.accountId));
  if (account && msg.uid) {
    try {
      await moveToTrash(account, [msg.uid]);
    } catch {
      // ook bij IMAP-fout de mail lokaal als verwijderd markeren
    }
  }
  await db.update(mailMessages).set({ status: "verwijderd" }).where(eq(mailMessages.id, messageId));
  revalidatePath("/mail");
}

export async function deleteMessagesBulkAction(ids: number[]): Promise<void> {
  await requireSession();
  if (ids.length === 0) return;

  const rows = await db
    .select({ id: mailMessages.id, accountId: mailMessages.accountId, uid: mailMessages.uid })
    .from(mailMessages)
    .where(inArray(mailMessages.id, ids));

  // Per account groeperen zodat we één IMAP-verbinding per account gebruiken.
  const byAccount = new Map<number, number[]>();
  for (const r of rows) {
    if (!r.uid) continue;
    byAccount.set(r.accountId, [...(byAccount.get(r.accountId) ?? []), r.uid]);
  }
  for (const [accountId, uids] of byAccount) {
    const [account] = await db.select().from(mailAccounts).where(eq(mailAccounts.id, accountId));
    if (account) {
      try {
        await moveToTrash(account, uids);
      } catch {
        // negeer IMAP-fout; lokaal markeren gebeurt hieronder
      }
    }
  }

  await db.update(mailMessages).set({ status: "verwijderd" }).where(inArray(mailMessages.id, ids));
  revalidatePath("/mail");
}

export async function ignoreMessageAction(messageId: number): Promise<void> {
  await requireSession();
  const [msg] = await db.select().from(mailMessages).where(eq(mailMessages.id, messageId));
  if (!msg) return;
  const [account] = await db.select().from(mailAccounts).where(eq(mailAccounts.id, msg.accountId));
  if (account && msg.uid) {
    try {
      await markSeen(account, msg.uid);
    } catch {
      // niet kritiek
    }
  }
  await db.update(mailMessages).set({ status: "genegeerd" }).where(eq(mailMessages.id, messageId));
  revalidatePath("/mail");
}

export async function ignoreMessagesBulkAction(ids: number[]): Promise<void> {
  await requireSession();
  if (ids.length === 0) return;
  await db.update(mailMessages).set({ status: "genegeerd" }).where(inArray(mailMessages.id, ids));
  revalidatePath("/mail");
}

/* --- Hele categorie in één keer (ook buiten de getoonde lijst) ------------- */

export interface MailCategoryFilter {
  categorie?: string;
  accountId?: number;
}

/** Bouwt de where-condities voor een categorie-brede actie. */
function categoryConds(filter: MailCategoryFilter) {
  const conds = [
    eq(mailMessages.status, "nieuw"),
    eq(mailMessages.category, filter.categorie!),
  ];
  if (filter.accountId != null) conds.push(eq(mailMessages.accountId, filter.accountId));
  return conds;
}

/**
 * Verplaatst álle mails van een categorie naar de Prullenbak — ook mails buiten
 * de getoonde 300. Werkt op query, niet op een id-lijst. Vereist een categorie
 * (nooit de hele inbox in één keer).
 */
export async function deleteCategoryAction(filter: MailCategoryFilter): Promise<number> {
  await requireSession();
  if (!filter.categorie) return 0;

  const conds = categoryConds(filter);
  const rows = await db
    .select({ accountId: mailMessages.accountId, uid: mailMessages.uid })
    .from(mailMessages)
    .where(and(...conds));

  if (rows.length === 0) return 0;

  // Per account groeperen; UID's in batches naar de Prullenbak.
  const byAccount = new Map<number, number[]>();
  for (const r of rows) {
    if (!r.uid) continue;
    const arr = byAccount.get(r.accountId);
    if (arr) arr.push(r.uid);
    else byAccount.set(r.accountId, [r.uid]);
  }

  for (const [accountId, uids] of byAccount) {
    const [account] = await db.select().from(mailAccounts).where(eq(mailAccounts.id, accountId));
    if (!account) continue;
    for (let i = 0; i < uids.length; i += 500) {
      try {
        await moveToTrash(account, uids.slice(i, i + 500));
      } catch {
        // IMAP-fout niet-fataal; lokaal markeren gebeurt hieronder
      }
    }
  }

  await db.update(mailMessages).set({ status: "verwijderd" }).where(and(...conds));
  revalidatePath("/mail");
  return rows.length;
}

/** Markeert álle mails van een categorie als genegeerd (DB-only, net als de bulk-negeer). */
export async function ignoreCategoryAction(filter: MailCategoryFilter): Promise<number> {
  await requireSession();
  if (!filter.categorie) return 0;

  const conds = categoryConds(filter);
  const rows = await db.update(mailMessages).set({ status: "genegeerd" }).where(and(...conds)).returning({ id: mailMessages.id });
  revalidatePath("/mail");
  return rows.length;
}

/** Markeert een geopende mail als gelezen op de server (\Seen), best-effort. */
export async function markReadAction(messageId: number): Promise<void> {
  await requireSession();
  const [msg] = await db.select().from(mailMessages).where(eq(mailMessages.id, messageId));
  if (!msg || !msg.uid) return;
  const [account] = await db.select().from(mailAccounts).where(eq(mailAccounts.id, msg.accountId));
  if (!account) return;
  try {
    await markSeen(account, msg.uid);
  } catch {
    // niet kritiek
  }
}
