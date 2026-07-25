import "server-only";
import { and, eq, isNull, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { mailAccounts, mailMessages, type MailAccount } from "@/lib/db/schema";
import { fetchNewInboxMessages } from "./imap";
import { categorizeMails, type CategorizeInput } from "@/lib/ai/mail-ai";

const FETCH_PER_ACCOUNT = 25;
const CATEGORIZE_PER_RUN = 40;
const CATEGORIZE_BATCH = 20;

export interface AccountSyncResult {
  accountId: number;
  email: string;
  nieuw: number;
  fout?: string;
}

export interface MailSyncResult {
  perAccount: AccountSyncResult[];
  gecategoriseerd: number;
}

/** Haalt nieuwe mail op voor één account en bewaart die. */
async function syncAccount(account: MailAccount): Promise<AccountSyncResult> {
  const base = { accountId: account.id, email: account.email };
  try {
    const { messages, highestUid, uidValidity, uidValidityChanged } =
      await fetchNewInboxMessages(account, FETCH_PER_ACCOUNT);

    // Bij een UIDVALIDITY-wissel restarten de UID's; dedupliceer dan op Message-ID.
    let skip = new Set<string>();
    if (uidValidityChanged) {
      const existing = await db
        .select({ messageId: mailMessages.messageId })
        .from(mailMessages)
        .where(
          and(eq(mailMessages.accountId, account.id), isNotNull(mailMessages.messageId))
        );
      skip = new Set(existing.map((r) => r.messageId!).filter(Boolean));
    }

    let nieuw = 0;
    for (const m of messages) {
      if (m.messageId && skip.has(m.messageId)) continue;
      const inserted = await db
        .insert(mailMessages)
        .values({
          accountId: account.id,
          mailbox: "INBOX",
          uid: m.uid,
          messageId: m.messageId,
          inReplyTo: m.inReplyTo,
          references: m.references,
          fromAddress: m.fromAddress,
          fromName: m.fromName,
          toAddress: m.toAddress,
          subject: m.subject,
          date: m.date,
          snippet: m.snippet,
          bodyText: m.bodyText,
          bodyHtml: m.bodyHtml,
        })
        .onConflictDoNothing()
        .returning({ id: mailMessages.id });
      if (inserted.length > 0) nieuw++;
    }

    // Sync-state bijwerken. Highest UID alleen verhogen, nooit verlagen (tenzij reset).
    const newLastSeen =
      uidValidityChanged || account.lastSeenUid == null
        ? highestUid ?? account.lastSeenUid
        : Math.max(account.lastSeenUid, highestUid ?? account.lastSeenUid);

    await db
      .update(mailAccounts)
      .set({
        lastSeenUid: newLastSeen ?? null,
        uidValidity,
        lastSyncAt: new Date(),
        lastError: null,
      })
      .where(eq(mailAccounts.id, account.id));

    return { ...base, nieuw };
  } catch (err) {
    const fout = err instanceof Error ? err.message : String(err);
    await db
      .update(mailAccounts)
      .set({ lastError: fout, lastSyncAt: new Date() })
      .where(eq(mailAccounts.id, account.id));
    return { ...base, nieuw: 0, fout };
  }
}

/** Categoriseert nog-niet-gecategoriseerde nieuwe mails, in batches. */
async function categorizeNew(): Promise<number> {
  const rows = await db
    .select({
      id: mailMessages.id,
      fromAddress: mailMessages.fromAddress,
      subject: mailMessages.subject,
      bodyText: mailMessages.bodyText,
      snippet: mailMessages.snippet,
    })
    .from(mailMessages)
    .where(and(isNull(mailMessages.category), eq(mailMessages.status, "nieuw")))
    .limit(CATEGORIZE_PER_RUN);

  if (rows.length === 0) return 0;

  let done = 0;
  for (let i = 0; i < rows.length; i += CATEGORIZE_BATCH) {
    const batch = rows.slice(i, i + CATEGORIZE_BATCH);
    const input: CategorizeInput[] = batch.map((r) => ({
      id: r.id,
      from: r.fromAddress ?? "onbekend",
      subject: r.subject ?? "(geen onderwerp)",
      text: r.bodyText ?? r.snippet ?? "",
    }));
    const cats = await categorizeMails(input);
    for (const [id, categorie] of cats) {
      await db
        .update(mailMessages)
        .set({ category: categorie })
        .where(eq(mailMessages.id, id));
      done++;
    }
  }
  return done;
}

/**
 * Volledige sync: nieuwe mail ophalen per account, daarna categoriseren.
 * Wordt gedeeld door de cron-route en de "Synchroniseer"-knop. Het werk is
 * begrensd zodat het binnen de Vercel-tijdslimiet blijft; de rest pakt de
 * volgende run op.
 */
export async function runMailSync(opts?: {
  accountId?: number;
}): Promise<MailSyncResult> {
  const accounts = await db
    .select()
    .from(mailAccounts)
    .where(
      opts?.accountId != null
        ? and(eq(mailAccounts.active, true), eq(mailAccounts.id, opts.accountId))
        : eq(mailAccounts.active, true)
    );

  const perAccount: AccountSyncResult[] = [];
  for (const account of accounts) {
    perAccount.push(await syncAccount(account));
  }

  const gecategoriseerd = await categorizeNew();
  return { perAccount, gecategoriseerd };
}
