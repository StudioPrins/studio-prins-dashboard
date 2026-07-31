import "server-only";
import { ImapFlow, type ListResponse, type SearchObject } from "imapflow";
import { simpleParser, type ParsedMail, type AddressObject } from "mailparser";
import { decryptSecret } from "./crypto";
import type { MailAccount } from "@/lib/db/schema";

/** Verbindingsgegevens voor IMAP (wachtwoord in platte tekst). */
export interface ImapCreds {
  imapHost: string;
  imapPort: number;
  username: string;
  password: string;
}

const MAX_BODY = 50_000;
const MAX_EXAMPLE_BODY = 4_000;

function imapCredsFromAccount(account: MailAccount): ImapCreds {
  return {
    imapHost: account.imapHost,
    imapPort: account.imapPort,
    username: account.username,
    password: decryptSecret(account.passwordEnc),
  };
}

/** Opent een verse IMAP-verbinding, draait fn en sluit altijd netjes af. */
export async function withImap<T>(
  creds: ImapCreds,
  fn: (client: ImapFlow) => Promise<T>
): Promise<T> {
  const client = new ImapFlow({
    host: creds.imapHost,
    port: creds.imapPort,
    secure: true,
    auth: { user: creds.username, pass: creds.password },
    logger: false,
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.logout().catch(() => {});
  }
}

/* --- Mapdetectie ---------------------------------------------------------- */

const SENT_NAMES = [
  "sent",
  "sent items",
  "sent messages",
  "sent mail",
  "verzonden",
  "verzonden items",
  "verzonden berichten",
];
const TRASH_NAMES = [
  "trash",
  "deleted",
  "deleted items",
  "deleted messages",
  "bin",
  "prullenbak",
  "prullebak",
  "verwijderde items",
  "verwijderd",
];

function matchFolder(
  boxes: ListResponse[],
  specialUse: string,
  names: string[]
): string | null {
  // 1. Officiële SPECIAL-USE-vlag (meest betrouwbaar).
  const special = boxes.find((b) => b.specialUse === specialUse);
  if (special) return special.path;
  // 2. Fallback op naamvarianten: laatste padsegment of volledige pad.
  const byName = boxes.find((b) => {
    const name = b.name.toLowerCase();
    const path = b.path.toLowerCase();
    return names.includes(name) || names.some((n) => path.endsWith(n));
  });
  return byName?.path ?? null;
}

export interface FolderDetection {
  sentFolder: string | null;
  trashFolder: string | null;
  allFolders: string[];
}

export async function detectFolders(client: ImapFlow): Promise<FolderDetection> {
  const boxes = await client.list();
  return {
    sentFolder: matchFolder(boxes, "\\Sent", SENT_NAMES),
    trashFolder: matchFolder(boxes, "\\Trash", TRASH_NAMES),
    allFolders: boxes.map((b) => b.path),
  };
}

/* --- Parsing -------------------------------------------------------------- */

export interface FetchedMessage {
  uid: number;
  messageId: string | null;
  inReplyTo: string | null;
  references: string | null;
  fromAddress: string | null;
  fromName: string | null;
  toAddress: string | null;
  subject: string | null;
  date: Date | null;
  snippet: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
}

function firstAddress(a: AddressObject | AddressObject[] | undefined): {
  address: string | null;
  name: string | null;
} {
  const obj = Array.isArray(a) ? a[0] : a;
  const v = obj?.value?.[0];
  return { address: v?.address?.toLowerCase() ?? null, name: v?.name || null };
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + "\n\n[… ingekort …]";
}

function snippetOf(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 200);
}

async function parseSource(uid: number, source: Buffer): Promise<FetchedMessage> {
  const mail: ParsedMail = await simpleParser(source);
  const from = firstAddress(mail.from);
  const to = firstAddress(mail.to);
  const text = (mail.text ?? "").trim();
  const references = Array.isArray(mail.references)
    ? mail.references.join(" ")
    : mail.references ?? null;

  return {
    uid,
    messageId: mail.messageId ?? null,
    inReplyTo: mail.inReplyTo ?? null,
    references,
    fromAddress: from.address,
    fromName: from.name,
    toAddress: to.address,
    subject: mail.subject ?? null,
    date: mail.date ?? null,
    snippet: text ? snippetOf(text) : null,
    bodyText: text ? truncate(text, MAX_BODY) : null,
    bodyHtml: typeof mail.html === "string" ? truncate(mail.html, MAX_BODY) : null,
  };
}

/* --- INBOX synchroniseren ------------------------------------------------- */

export interface InboxFetchResult {
  messages: FetchedMessage[];
  /** Alle ongelezen UID's in de INBOX (ook de niet-opgehaalde) — basis voor afstemming. */
  unreadUids: number[];
  /** True als er meer ongelezen mail was dan `limit`; de rest volgt de volgende run. */
  truncated: boolean;
  highestUid: number | null;
  uidValidity: string;
  /** True als UIDVALIDITY wisselde t.o.v. de opgeslagen waarde (reset nodig). */
  uidValidityChanged: boolean;
}

function dayKey(d: Date): string {
  return d.toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
}

/**
 * Haalt alle ongelezen INBOX-berichten op (optioneel vanaf `account.syncSince`),
 * met uitzondering van UID's die al bekend zijn (`skipUids`). Ophalen van de
 * berichtinhoud is begrensd op `limit`; de zoekopdracht zelf levert altijd de
 * volledige lijst ongelezen UID's, zodat de aanroeper kan afstemmen op wat er
 * elders inmiddels als gelezen is gemarkeerd.
 */
export async function fetchUnreadInboxMessages(
  account: MailAccount,
  opts: { limit: number; skipUids?: Set<number> }
): Promise<InboxFetchResult> {
  return withImap(imapCredsFromAccount(account), async (client) => {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const box = client.mailbox;
      if (!box) throw new Error("Kon INBOX niet openen.");
      const uidValidity = box.uidValidity.toString();
      const uidValidityChanged =
        account.uidValidity != null && account.uidValidity !== uidValidity;

      const criteria: SearchObject = { seen: false };
      if (account.syncSince) criteria.since = account.syncSince;

      const found = await client.search(criteria, { uid: true });
      const unreadUids = (Array.isArray(found) ? found : []).sort((a, b) => a - b);

      const todo = opts.skipUids
        ? unreadUids.filter((u) => !opts.skipUids!.has(u))
        : unreadUids;
      const batch = todo.slice(0, opts.limit);
      const truncated = todo.length > batch.length;

      const messages: FetchedMessage[] = [];
      let highestUid: number | null = null;
      for (const uid of batch) {
        const msg = await client.fetchOne(
          String(uid),
          { source: true },
          { uid: true }
        );
        if (!msg || !msg.source) continue;
        const parsed = await parseSource(uid, msg.source);
        // Vangnet: INTERNALDATE (waarop `since` filtert) en de Date-header
        // kunnen verschillen; berichten zonder Date-header worden behouden.
        if (account.syncSince && parsed.date && dayKey(parsed.date) < dayKey(account.syncSince)) {
          continue;
        }
        messages.push(parsed);
        highestUid = highestUid == null ? uid : Math.max(highestUid, uid);
      }

      return { messages, unreadUids, truncated, highestUid, uidValidity, uidValidityChanged };
    } finally {
      lock.release();
    }
  });
}

/* --- Mutaties (terug-syncen naar de mailbox) ------------------------------ */

/** Markeert een INBOX-bericht als gelezen (\Seen), zodat Outlook meeloopt. */
export async function markSeen(account: MailAccount, uid: number): Promise<void> {
  await withImap(imapCredsFromAccount(account), async (client) => {
    const lock = await client.getMailboxLock("INBOX");
    try {
      await client.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true });
    } finally {
      lock.release();
    }
  });
}

/**
 * Verplaatst een of meer INBOX-berichten naar de Prullenbak. Valt terug op
 * \Deleted + expunge als de doelmap ontbreekt of de move faalt.
 */
export async function moveToTrash(
  account: MailAccount,
  uids: number[]
): Promise<void> {
  if (uids.length === 0) return;
  const range = uids.join(",");
  await withImap(imapCredsFromAccount(account), async (client) => {
    const lock = await client.getMailboxLock("INBOX");
    try {
      if (account.trashFolder) {
        try {
          await client.messageMove(range, account.trashFolder, { uid: true });
          return;
        } catch {
          // val door naar de \Deleted-fallback
        }
      }
      await client.messageFlagsAdd(range, ["\\Deleted"], { uid: true });
      await client.messageDelete(range, { uid: true });
    } finally {
      lock.release();
    }
  });
}

/** Bewaart een verstuurde mail (ruwe MIME) in de Verzonden-map. */
export async function appendToSent(
  account: MailAccount,
  raw: Buffer
): Promise<void> {
  if (!account.sentFolder) return;
  await withImap(imapCredsFromAccount(account), async (client) => {
    await client.append(account.sentFolder!, raw, ["\\Seen"]);
  });
}

/* --- Stijlvoorbeelden uit de Verzonden-map -------------------------------- */

export interface SentExample {
  toAddress: string | null;
  subject: string | null;
  bodyText: string;
  date: Date | null;
}

// Strip een geciteerd antwoordgedeelte ("Op ... schreef ...", ">"-regels).
function stripQuoted(text: string): string {
  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  for (const line of lines) {
    if (/^\s*Op .+ schreef .+:?$/i.test(line)) break;
    if (/^\s*On .+ wrote:?$/i.test(line)) break;
    if (/^\s*-{2,}\s*Oorspronkelijk bericht\s*-{2,}/i.test(line)) break;
    if (/^\s*>/.test(line)) continue;
    out.push(line);
  }
  return out.join("\n").trim();
}

export async function fetchSentExamples(
  account: MailAccount,
  n = 50
): Promise<SentExample[]> {
  if (!account.sentFolder) return [];
  return withImap(imapCredsFromAccount(account), async (client) => {
    const lock = await client.getMailboxLock(account.sentFolder!);
    try {
      const box = client.mailbox;
      if (!box || box.exists === 0) return [];
      // We pakken de laatste n op volgnummer en filteren daarna.
      const start = Math.max(1, box.exists - n + 1);
      const range = `${start}:${box.exists}`;
      const examples: SentExample[] = [];
      for await (const msg of client.fetch(range, { source: true })) {
        if (!msg.source) continue;
        const parsed = await parseSource(msg.uid ?? 0, msg.source);
        const body = stripQuoted(parsed.bodyText ?? "");
        if (body.length < 20) continue; // te kort / leeg / enkel doorstuur
        examples.push({
          toAddress: parsed.toAddress,
          subject: parsed.subject,
          bodyText: body.slice(0, MAX_EXAMPLE_BODY),
          date: parsed.date,
        });
      }
      // Nieuwste eerst.
      examples.sort(
        (a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0)
      );
      return examples.slice(0, n);
    } finally {
      lock.release();
    }
  });
}

/* --- Verbindingstest (voor de instellingen-UI) ---------------------------- */

export interface ConnectionTestResult {
  ok: boolean;
  error?: string;
  sentFolder?: string | null;
  trashFolder?: string | null;
  allFolders?: string[];
}

/** Test alleen de IMAP-kant: inloggen + mappen ontdekken. */
export async function testImapConnection(
  creds: ImapCreds
): Promise<ConnectionTestResult> {
  try {
    const folders = await withImap(creds, (client) => detectFolders(client));
    return {
      ok: true,
      sentFolder: folders.sentFolder,
      trashFolder: folders.trashFolder,
      allFolders: folders.allFolders,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
