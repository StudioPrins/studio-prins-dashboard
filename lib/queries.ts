import "server-only";
import { and, desc, eq, inArray, asc, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, tasks, invoices, invoiceLines, leads, companySettings, checklistTemplate, intakeFields, mailAccounts, mailMessages, uren } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth";
import { invoiceTotals, type InvoiceTotals } from "@/lib/invoice-calc";
import { sanitizeEmailHtml } from "@/lib/mail/sanitize";
import { BEDRIJF } from "@/lib/bedrijf";
import type { Client, Task, Invoice, InvoiceLine, Lead, ChecklistTemplateItem, IntakeFieldRow, MailAccount, MailAccountView, UurRegistratie } from "@/lib/db/schema";

/** Effectieve bedrijfsgegevens: DB-instellingen over de code-defaults heen. */
export type Bedrijf = {
  naam: string;
  tagline: string;
  email: string;
  telefoon: string;
  website: string;
  adres: string;
  postcode: string;
  plaats: string;
  kvk: string;
  btw: string;
  iban: string;
  tenaamstelling: string;
  kor: boolean;
  korVermelding: string;
  standaardBtw: number;
  betaaltermijnMaanden: number;
};

const pick = (v: string | null | undefined, d: string) => (v && v.trim() ? v : d);

export async function getCompanySettings(): Promise<Bedrijf> {
  await requireSession();
  const [row] = await db.select().from(companySettings).where(eq(companySettings.id, 1));
  return {
    naam: pick(row?.naam, BEDRIJF.naam),
    tagline: pick(row?.tagline, BEDRIJF.tagline),
    email: pick(row?.email, BEDRIJF.email),
    telefoon: pick(row?.telefoon, BEDRIJF.telefoon),
    website: pick(row?.website, BEDRIJF.website),
    adres: pick(row?.adres, BEDRIJF.adres),
    postcode: pick(row?.postcode, BEDRIJF.postcode),
    plaats: pick(row?.plaats, BEDRIJF.plaats),
    kvk: pick(row?.kvk, BEDRIJF.kvk),
    btw: pick(row?.btw, BEDRIJF.btw),
    iban: pick(row?.iban, BEDRIJF.iban),
    tenaamstelling: pick(row?.tenaamstelling, BEDRIJF.tenaamstelling),
    kor: BEDRIJF.kor,
    korVermelding: BEDRIJF.korVermelding,
    standaardBtw: BEDRIJF.standaardBtw,
    betaaltermijnMaanden: BEDRIJF.betaaltermijnMaanden,
  };
}

export type InvoiceWithTotals = Invoice & {
  lines: InvoiceLine[];
  totals: InvoiceTotals;
};

/** Haalt de regels voor een set facturen op en berekent per stuk de totalen. */
async function attachTotals(rows: Invoice[]): Promise<InvoiceWithTotals[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const lines = await db
    .select()
    .from(invoiceLines)
    .where(inArray(invoiceLines.invoiceId, ids))
    .orderBy(asc(invoiceLines.volgorde), asc(invoiceLines.id));

  const byInvoice = new Map<number, InvoiceLine[]>();
  for (const l of lines) {
    const arr = byInvoice.get(l.invoiceId) ?? [];
    arr.push(l);
    byInvoice.set(l.invoiceId, arr);
  }

  return rows.map((r) => {
    const ls = byInvoice.get(r.id) ?? [];
    return { ...r, lines: ls, totals: invoiceTotals(ls, r.btwPercentage) };
  });
}

export type ClientOverview = {
  client: Client;
  tasksDone: number;
  tasksTotal: number;
  openstaandCents: number;
};

/** Alle klanten met checklist-voortgang en openstaand factuurbedrag. */
export async function getClientsOverview(): Promise<ClientOverview[]> {
  await requireSession();

  const [clientRows, taskRows] = await Promise.all([
    db.select().from(clients).orderBy(desc(clients.createdAt)),
    db.select({ clientId: tasks.clientId, done: tasks.done }).from(tasks),
  ]);

  const openInvoices = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.type, "factuur"),
        inArray(invoices.status, ["verzonden", "verlopen"])
      )
    );
  const openWithTotals = await attachTotals(openInvoices);

  const done = new Map<number, number>();
  const total = new Map<number, number>();
  for (const t of taskRows) {
    total.set(t.clientId, (total.get(t.clientId) ?? 0) + 1);
    if (t.done) done.set(t.clientId, (done.get(t.clientId) ?? 0) + 1);
  }

  const openByClient = new Map<number, number>();
  for (const inv of openWithTotals) {
    if (inv.clientId == null) continue;
    openByClient.set(
      inv.clientId,
      (openByClient.get(inv.clientId) ?? 0) + inv.totals.totaalCents
    );
  }

  return clientRows.map((client) => ({
    client,
    tasksDone: done.get(client.id) ?? 0,
    tasksTotal: total.get(client.id) ?? 0,
    openstaandCents: openByClient.get(client.id) ?? 0,
  }));
}

export type ClientDetail = {
  client: Client;
  tasks: Task[];
  invoices: InvoiceWithTotals[];
};

/** Eén klant met taken en facturen. Null als niet gevonden. */
export async function getClientDetail(id: number): Promise<ClientDetail | null> {
  await requireSession();

  const [client] = await db.select().from(clients).where(eq(clients.id, id));
  if (!client) return null;

  const [taskRows, invoiceRows] = await Promise.all([
    db
      .select()
      .from(tasks)
      .where(eq(tasks.clientId, id))
      .orderBy(asc(tasks.volgorde), asc(tasks.id)),
    db
      .select()
      .from(invoices)
      .where(eq(invoices.clientId, id))
      .orderBy(desc(invoices.datum), desc(invoices.id)),
  ]);

  return {
    client,
    tasks: taskRows,
    invoices: await attachTotals(invoiceRows),
  };
}

/** Alle facturen/offertes, nieuwste eerst, met totalen. */
export async function getInvoices(): Promise<InvoiceWithTotals[]> {
  await requireSession();
  const rows = await db
    .select()
    .from(invoices)
    .orderBy(desc(invoices.datum), desc(invoices.id));
  return attachTotals(rows);
}

/** Eén factuur/offerte met regels en totalen. */
export async function getInvoice(id: number): Promise<InvoiceWithTotals | null> {
  await requireSession();
  const [row] = await db.select().from(invoices).where(eq(invoices.id, id));
  if (!row) return null;
  const [withTotals] = await attachTotals([row]);
  return withTotals;
}

/** Beknopte klantenlijst voor selectievelden (factuur opmaken). */
export async function getClientsForSelect(): Promise<Client[]> {
  await requireSession();
  return db.select().from(clients).orderBy(asc(clients.bedrijf));
}

/** Alle urenregistraties, nieuwste eerst. */
export async function getUren(): Promise<UurRegistratie[]> {
  await requireSession();
  return db.select().from(uren).orderBy(desc(uren.datum), desc(uren.id));
}

/** Klanten waarop je uren kunt boeken: alles behalve gearchiveerd. */
export async function getKlantenVoorUren(): Promise<{ id: number; bedrijf: string; status: string }[]> {
  await requireSession();
  return db
    .select({ id: clients.id, bedrijf: clients.bedrijf, status: clients.status })
    .from(clients)
    .where(inArray(clients.status, ["actief", "onboarding", "onderhoud"]))
    .orderBy(asc(clients.bedrijf));
}

/** Alle handmatig toegevoegde leads, nieuwste eerst. */
export async function getLeads(): Promise<Lead[]> {
  await requireSession();
  return db.select().from(leads).orderBy(desc(leads.createdAt));
}

/**
 * Eén klant op basis van het onboarding-token. GEEN sessie vereist: dit voedt
 * de publieke intakeformulier-pagina. Null als het token niet klopt.
 */
export async function getClientByToken(token: string): Promise<Client | null> {
  const clean = token.trim();
  if (!clean) return null;
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.onboardingToken, clean));
  return client ?? null;
}

/** Het beheerbare checklist-hoofdsjabloon, op volgorde. */
export async function getChecklistTemplate(): Promise<ChecklistTemplateItem[]> {
  await requireSession();
  return db
    .select()
    .from(checklistTemplate)
    .orderBy(asc(checklistTemplate.volgorde), asc(checklistTemplate.id));
}

/**
 * De beheerbare vragen van het intakeformulier, op volgorde.
 *
 * Bewust ZONDER requireSession(): het publieke intakeformulier op
 * /onboarding/[token] rendert deze definities voor niet-ingelogde klanten.
 * Het gaat om veldlabels, niet om klantgegevens.
 */
export async function getIntakeFields(): Promise<IntakeFieldRow[]> {
  return db
    .select()
    .from(intakeFields)
    .orderBy(asc(intakeFields.volgorde), asc(intakeFields.id));
}

/** Alle gekoppelde mailaccounts, oudste eerst. Bevat het versleutelde wachtwoord. */
export async function getMailAccounts(): Promise<MailAccount[]> {
  await requireSession();
  return db.select().from(mailAccounts).orderBy(asc(mailAccounts.id));
}

/** Alle mailaccounts zonder het versleutelde wachtwoord — veilig voor de UI. */
export async function getMailAccountViews(): Promise<MailAccountView[]> {
  await requireSession();
  return db
    .select({
      id: mailAccounts.id,
      naam: mailAccounts.naam,
      email: mailAccounts.email,
      imapHost: mailAccounts.imapHost,
      imapPort: mailAccounts.imapPort,
      smtpHost: mailAccounts.smtpHost,
      smtpPort: mailAccounts.smtpPort,
      smtpSecure: mailAccounts.smtpSecure,
      username: mailAccounts.username,
      sentFolder: mailAccounts.sentFolder,
      trashFolder: mailAccounts.trashFolder,
      lastSeenUid: mailAccounts.lastSeenUid,
      uidValidity: mailAccounts.uidValidity,
      lastSyncAt: mailAccounts.lastSyncAt,
      lastError: mailAccounts.lastError,
      syncSince: mailAccounts.syncSince,
      styleProfile: mailAccounts.styleProfile,
      styleImportedAt: mailAccounts.styleImportedAt,
      active: mailAccounts.active,
      createdAt: mailAccounts.createdAt,
    })
    .from(mailAccounts)
    .orderBy(asc(mailAccounts.id));
}

/** Eén mailaccount op id, of null. */
export async function getMailAccount(id: number): Promise<MailAccount | null> {
  await requireSession();
  const [row] = await db.select().from(mailAccounts).where(eq(mailAccounts.id, id));
  return row ?? null;
}

/** Eén mailrij zoals de UI hem nodig heeft (met accountlabel en veilige HTML). */
export type MailRowView = {
  id: number;
  accountId: number;
  accountNaam: string;
  accountEmail: string;
  uid: number;
  fromAddress: string | null;
  fromName: string | null;
  toAddress: string | null;
  subject: string | null;
  date: Date | null;
  snippet: string | null;
  bodyText: string | null;
  bodyHtmlSafe: string | null;
  category: string | null;
  aiDraft: string | null;
  aiDraftGeneratedAt: Date | null;
  status: string;
};

/** Nieuwe (nog niet afgehandelde) mails, gefilterd op categorie/account. */
export async function getMailInbox(filter?: {
  categorie?: string;
  accountId?: number;
}): Promise<MailRowView[]> {
  await requireSession();

  const conds = [eq(mailMessages.status, "nieuw")];
  if (filter?.categorie) conds.push(eq(mailMessages.category, filter.categorie));
  if (filter?.accountId != null) conds.push(eq(mailMessages.accountId, filter.accountId));

  const rows = await db
    .select({
      id: mailMessages.id,
      accountId: mailMessages.accountId,
      accountNaam: mailAccounts.naam,
      accountEmail: mailAccounts.email,
      uid: mailMessages.uid,
      fromAddress: mailMessages.fromAddress,
      fromName: mailMessages.fromName,
      toAddress: mailMessages.toAddress,
      subject: mailMessages.subject,
      date: mailMessages.date,
      snippet: mailMessages.snippet,
      bodyText: mailMessages.bodyText,
      bodyHtml: mailMessages.bodyHtml,
      category: mailMessages.category,
      aiDraft: mailMessages.aiDraft,
      aiDraftGeneratedAt: mailMessages.aiDraftGeneratedAt,
      status: mailMessages.status,
    })
    .from(mailMessages)
    .innerJoin(mailAccounts, eq(mailMessages.accountId, mailAccounts.id))
    .where(and(...conds))
    .orderBy(desc(mailMessages.date), desc(mailMessages.id))
    .limit(300);

  return rows.map(({ bodyHtml, ...r }) => ({
    ...r,
    bodyHtmlSafe: bodyHtml ? sanitizeEmailHtml(bodyHtml) : null,
  }));
}

/**
 * Het echte totaal aantal mails voor de huidige weergave (zelfde filter als
 * getMailInbox, zonder de 300-limiet). Voor de "selecteer alle N in categorie".
 */
export async function getMailInboxCount(filter?: {
  categorie?: string;
  accountId?: number;
}): Promise<number> {
  await requireSession();

  const conds = [eq(mailMessages.status, "nieuw")];
  if (filter?.categorie) conds.push(eq(mailMessages.category, filter.categorie));
  if (filter?.accountId != null) conds.push(eq(mailMessages.accountId, filter.accountId));

  const [row] = await db
    .select({ n: count() })
    .from(mailMessages)
    .where(and(...conds));

  return row?.n ?? 0;
}

/** Aantallen per categorie voor de nieuwe mails (voor de tabbladen). */
export async function getMailCategoryCounts(): Promise<Record<string, number>> {
  await requireSession();
  const rows = await db
    .select({ category: mailMessages.category, n: count() })
    .from(mailMessages)
    .where(eq(mailMessages.status, "nieuw"))
    .groupBy(mailMessages.category);

  const out: Record<string, number> = {};
  let totaal = 0;
  for (const r of rows) {
    if (r.category) out[r.category] = r.n;
    totaal += r.n;
  }
  out.__totaal = totaal;
  return out;
}
