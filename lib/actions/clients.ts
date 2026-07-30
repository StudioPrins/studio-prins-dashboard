"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { clients, tasks, checklistTemplate } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth";
import { euroToCents } from "@/lib/format";
import { CHECKLIST_TEMPLATE } from "@/lib/checklist-template";

export type FormState = { error?: string; ok?: boolean };

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * De velden die zowel bij aanmaken als bewerken uit het formulier komen.
 * Bevat ook de facturatiegegevens, zodat een klant volledig handmatig kan
 * worden vastgelegd zonder het intakeformulier.
 */
function clientVelden(formData: FormData) {
  return {
    contactpersoon: str(formData.get("contactpersoon")) || null,
    email: str(formData.get("email")) || null,
    telefoon: str(formData.get("telefoon")) || null,
    websiteUrl: str(formData.get("websiteUrl")) || null,
    screenshotOverride: str(formData.get("screenshotOverride")) || null,
    adres: str(formData.get("adres")) || null,
    postcode: str(formData.get("postcode")) || null,
    plaats: str(formData.get("plaats")) || null,
    kvk: str(formData.get("kvk")) || null,
    btw: str(formData.get("btw")) || null,
    iban: str(formData.get("iban")) || null,
    abonnementCents: euroToCents(str(formData.get("abonnement")) || "0"),
    status: str(formData.get("status")) || "onboarding",
    notities: str(formData.get("notities")) || null,
  };
}

/** Nieuwe klant + automatisch de onboarding-checklist. Redirect naar detail. */
export async function createClient(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireSession();

  const bedrijf = str(formData.get("bedrijf"));
  if (!bedrijf) return { error: "Bedrijfsnaam is verplicht." };

  const [created] = await db
    .insert(clients)
    .values({ bedrijf, ...clientVelden(formData) })
    .returning({ id: clients.id });

  await seedChecklist(created.id);

  revalidatePath("/");
  redirect(`/klanten/${created.id}`);
}

/**
 * Maakt de onboarding-taken aan voor een klant vanuit het beheerbare
 * hoofdsjabloon (checklist_template). Valt terug op de code-constante als het
 * sjabloon (nog) leeg is.
 */
export async function seedChecklist(clientId: number): Promise<void> {
  const template = await db
    .select({ titel: checklistTemplate.titel })
    .from(checklistTemplate)
    .orderBy(asc(checklistTemplate.volgorde), asc(checklistTemplate.id));

  const titels = template.length > 0 ? template.map((t) => t.titel) : CHECKLIST_TEMPLATE;

  await db.insert(tasks).values(
    titels.map((titel, i) => ({
      clientId,
      titel,
      volgorde: i,
    }))
  );
}

export async function updateClient(
  id: number,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireSession();

  const bedrijf = str(formData.get("bedrijf"));
  if (!bedrijf) return { error: "Bedrijfsnaam is verplicht." };

  await db
    .update(clients)
    .set({ bedrijf, ...clientVelden(formData) })
    .where(eq(clients.id, id));

  revalidatePath("/");
  revalidatePath(`/klanten/${id}`);
  return { ok: true };
}

export async function updateClientStatus(id: number, status: string) {
  await requireSession();
  await db.update(clients).set({ status }).where(eq(clients.id, id));
  revalidatePath("/");
  revalidatePath(`/klanten/${id}`);
}

export async function deleteClient(id: number) {
  await requireSession();
  await db.delete(clients).where(eq(clients.id, id));
  revalidatePath("/");
  redirect("/");
}

/* --- Checklist-taken --- */

export async function toggleTask(taskId: number, clientId: number, done: boolean) {
  await requireSession();
  await db.update(tasks).set({ done }).where(eq(tasks.id, taskId));

  // Automatisch naar "actief" als de hele checklist af is (vanuit onboarding).
  const remaining = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.clientId, clientId), eq(tasks.done, false)));
  if (remaining.length === 0) {
    const [c] = await db
      .select({ status: clients.status })
      .from(clients)
      .where(eq(clients.id, clientId));
    if (c?.status === "onboarding") {
      await db.update(clients).set({ status: "actief" }).where(eq(clients.id, clientId));
    }
  }

  revalidatePath(`/klanten/${clientId}`);
  revalidatePath("/");
}

export async function addTask(clientId: number, titel: string) {
  await requireSession();
  const clean = titel.trim();
  if (!clean) return;
  const existing = await db
    .select({ volgorde: tasks.volgorde })
    .from(tasks)
    .where(eq(tasks.clientId, clientId));
  const maxOrder = existing.reduce((m, t) => Math.max(m, t.volgorde), -1);
  await db.insert(tasks).values({ clientId, titel: clean, volgorde: maxOrder + 1 });
  revalidatePath(`/klanten/${clientId}`);
}

export async function deleteTask(taskId: number, clientId: number) {
  await requireSession();
  await db.delete(tasks).where(eq(tasks.id, taskId));
  revalidatePath(`/klanten/${clientId}`);
}

export async function renameTask(taskId: number, clientId: number, titel: string) {
  await requireSession();
  const clean = titel.trim();
  if (!clean) return;
  await db.update(tasks).set({ titel: clean }).where(eq(tasks.id, taskId));
  revalidatePath(`/klanten/${clientId}`);
}

/** Verschuift een taak omhoog/omlaag door de volgorde met de buur te wisselen. */
export async function moveTask(
  taskId: number,
  clientId: number,
  richting: "up" | "down"
) {
  await requireSession();
  const rows = await db
    .select({ id: tasks.id, volgorde: tasks.volgorde })
    .from(tasks)
    .where(eq(tasks.clientId, clientId))
    .orderBy(asc(tasks.volgorde), asc(tasks.id));

  const idx = rows.findIndex((r) => r.id === taskId);
  if (idx === -1) return;
  const swapIdx = richting === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= rows.length) return;

  const a = rows[idx];
  const b = rows[swapIdx];
  // Volgorde-waarden omwisselen (met tijdelijke waarde tegen de unique-loze botsing).
  await db.update(tasks).set({ volgorde: b.volgorde }).where(eq(tasks.id, a.id));
  await db.update(tasks).set({ volgorde: a.volgorde }).where(eq(tasks.id, b.id));

  revalidatePath(`/klanten/${clientId}`);
}
