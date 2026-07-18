"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { invoices, invoiceLines, clients } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth";
import { euroToCents, addMonths, toISODate } from "@/lib/format";
import { nextInvoiceNumber } from "@/lib/invoice-number";
import { BEDRIJF } from "@/lib/bedrijf";

export type FormState = { error?: string };

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

/** "1,5" of "2" → nette decimale string "1.50". */
function normalizeQty(v: string): string {
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? String(n) : "1";
}

/** Maakt een factuur of offerte met regels aan. Redirect naar het detail. */
export async function createInvoice(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireSession();

  const type = str(formData.get("type")) === "offerte" ? "offerte" : "factuur";

  const ontvangerBedrijf = str(formData.get("ontvangerBedrijf"));
  if (!ontvangerBedrijf) return { error: "Vul een ontvanger (bedrijfsnaam) in." };

  const clientIdRaw = str(formData.get("clientId"));
  const clientId = clientIdRaw ? Number(clientIdRaw) : null;

  const omschrijvingen = formData.getAll("omschrijving").map((v) => String(v).trim());
  const aantallen = formData.getAll("aantal").map((v) => String(v));
  const prijzen = formData.getAll("prijs").map((v) => String(v));

  const lineValues = omschrijvingen
    .map((omschrijving, i) => ({
      omschrijving,
      aantal: normalizeQty(aantallen[i] ?? "1"),
      prijsCents: euroToCents(prijzen[i] ?? "0"),
      volgorde: i,
    }))
    .filter((l) => l.omschrijving.length > 0);

  if (lineValues.length === 0)
    return { error: "Voeg minstens één regel met omschrijving toe." };

  const datum = str(formData.get("datum")) || toISODate();
  const vervaldatum =
    str(formData.get("vervaldatum")) ||
    (type === "factuur" ? addMonths(BEDRIJF.betaaltermijnMaanden, new Date(datum)) : "");
  const btwRaw = str(formData.get("btwPercentage"));
  const btwPercentage = btwRaw === "" ? BEDRIJF.standaardBtw : Number(btwRaw);

  const nummer = await nextInvoiceNumber(type);

  const [created] = await db
    .insert(invoices)
    .values({
      type,
      nummer,
      clientId: clientId && Number.isFinite(clientId) ? clientId : null,
      ontvangerBedrijf,
      ontvangerContact: str(formData.get("ontvangerContact")) || null,
      ontvangerEmail: str(formData.get("ontvangerEmail")) || null,
      ontvangerAdres: str(formData.get("ontvangerAdres")) || null,
      datum,
      vervaldatum: vervaldatum || null,
      status: "concept",
      btwPercentage: Number.isFinite(btwPercentage) ? btwPercentage : 21,
      notitie: str(formData.get("notitie")) || null,
    })
    .returning({ id: invoices.id });

  await db
    .insert(invoiceLines)
    .values(lineValues.map((l) => ({ ...l, invoiceId: created.id })));

  revalidatePath("/facturen");
  if (clientId) revalidatePath(`/klanten/${clientId}`);
  redirect(`/facturen/${created.id}`);
}

export async function updateInvoiceStatus(id: number, status: string) {
  await requireSession();
  await db.update(invoices).set({ status }).where(eq(invoices.id, id));
  revalidatePath("/facturen");
  revalidatePath(`/facturen/${id}`);
}

export async function deleteInvoice(id: number) {
  await requireSession();
  await db.delete(invoices).where(eq(invoices.id, id));
  revalidatePath("/facturen");
  redirect("/facturen");
}

/** Zet een offerte om in een nieuwe factuur (offerte blijft bestaan). */
export async function convertOfferteToFactuur(id: number) {
  await requireSession();

  const [offerte] = await db.select().from(invoices).where(eq(invoices.id, id));
  if (!offerte || offerte.type !== "offerte") redirect(`/facturen/${id}`);

  const lines = await db
    .select()
    .from(invoiceLines)
    .where(eq(invoiceLines.invoiceId, id));

  const nummer = await nextInvoiceNumber("factuur");
  const datum = toISODate();

  const [created] = await db
    .insert(invoices)
    .values({
      type: "factuur",
      nummer,
      clientId: offerte.clientId,
      ontvangerBedrijf: offerte.ontvangerBedrijf,
      ontvangerContact: offerte.ontvangerContact,
      ontvangerEmail: offerte.ontvangerEmail,
      ontvangerAdres: offerte.ontvangerAdres,
      datum,
      vervaldatum: addMonths(BEDRIJF.betaaltermijnMaanden, new Date(datum)),
      status: "concept",
      btwPercentage: offerte.btwPercentage,
      notitie: offerte.notitie,
    })
    .returning({ id: invoices.id });

  if (lines.length > 0) {
    await db.insert(invoiceLines).values(
      lines.map((l) => ({
        invoiceId: created.id,
        omschrijving: l.omschrijving,
        aantal: l.aantal,
        prijsCents: l.prijsCents,
        volgorde: l.volgorde,
      }))
    );
  }

  revalidatePath("/facturen");
  redirect(`/facturen/${created.id}`);
}

/** Klantgegevens voor het vooraf invullen van de ontvanger op een factuur. */
export async function clientRecipient(clientId: number) {
  await requireSession();
  const [c] = await db.select().from(clients).where(eq(clients.id, clientId));
  return c ?? null;
}
