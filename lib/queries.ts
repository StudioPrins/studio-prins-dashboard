import "server-only";
import { and, desc, eq, inArray, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, tasks, invoices, invoiceLines, leads, companySettings } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth";
import { invoiceTotals, type InvoiceTotals } from "@/lib/invoice-calc";
import { BEDRIJF } from "@/lib/bedrijf";
import type { Client, Task, Invoice, InvoiceLine, Lead } from "@/lib/db/schema";

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

/** Alle handmatig toegevoegde leads, nieuwste eerst. */
export async function getLeads(): Promise<Lead[]> {
  await requireSession();
  return db.select().from(leads).orderBy(desc(leads.createdAt));
}
