"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { clients, tasks } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth";
import { euroToCents } from "@/lib/format";
import { CHECKLIST_TEMPLATE } from "@/lib/checklist-template";

export type FormState = { error?: string; ok?: boolean };

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
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
    .values({
      bedrijf,
      contactpersoon: str(formData.get("contactpersoon")) || null,
      email: str(formData.get("email")) || null,
      telefoon: str(formData.get("telefoon")) || null,
      websiteUrl: str(formData.get("websiteUrl")) || null,
      screenshotOverride: str(formData.get("screenshotOverride")) || null,
      adres: str(formData.get("adres")) || null,
      abonnementCents: euroToCents(str(formData.get("abonnement")) || "0"),
      status: str(formData.get("status")) || "onboarding",
      notities: str(formData.get("notities")) || null,
    })
    .returning({ id: clients.id });

  await seedChecklist(created.id);

  revalidatePath("/");
  redirect(`/klanten/${created.id}`);
}

/** Maakt de standaard checklist-taken aan voor een klant. */
export async function seedChecklist(clientId: number): Promise<void> {
  await db.insert(tasks).values(
    CHECKLIST_TEMPLATE.map((titel, i) => ({
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
    .set({
      bedrijf,
      contactpersoon: str(formData.get("contactpersoon")) || null,
      email: str(formData.get("email")) || null,
      telefoon: str(formData.get("telefoon")) || null,
      websiteUrl: str(formData.get("websiteUrl")) || null,
      screenshotOverride: str(formData.get("screenshotOverride")) || null,
      adres: str(formData.get("adres")) || null,
      abonnementCents: euroToCents(str(formData.get("abonnement")) || "0"),
      status: str(formData.get("status")) || "onboarding",
      notities: str(formData.get("notities")) || null,
    })
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
