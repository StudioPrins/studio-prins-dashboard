"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { leads, clients } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth";
import { seedChecklist } from "@/lib/actions/clients";

export type FormState = { error?: string; ok?: boolean };

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function createLead(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireSession();
  const bedrijf = str(formData.get("bedrijf"));
  if (!bedrijf) return { error: "Bedrijfsnaam is verplicht." };

  await db.insert(leads).values({
    bedrijf,
    contactpersoon: str(formData.get("contactpersoon")) || null,
    email: str(formData.get("email")) || null,
    telefoon: str(formData.get("telefoon")) || null,
    demoUrl: str(formData.get("demoUrl")) || null,
    status: str(formData.get("status")) || "nieuw",
    notities: str(formData.get("notities")) || null,
  });

  revalidatePath("/leads");
  return { ok: true };
}

export async function updateLead(
  id: number,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireSession();
  const bedrijf = str(formData.get("bedrijf"));
  if (!bedrijf) return { error: "Bedrijfsnaam is verplicht." };

  await db
    .update(leads)
    .set({
      bedrijf,
      contactpersoon: str(formData.get("contactpersoon")) || null,
      email: str(formData.get("email")) || null,
      telefoon: str(formData.get("telefoon")) || null,
      demoUrl: str(formData.get("demoUrl")) || null,
      status: str(formData.get("status")) || "nieuw",
      notities: str(formData.get("notities")) || null,
    })
    .where(eq(leads.id, id));

  revalidatePath("/leads");
  return { ok: true };
}

export async function updateLeadStatus(id: number, status: string) {
  await requireSession();
  await db.update(leads).set({ status }).where(eq(leads.id, id));
  revalidatePath("/leads");
}

export async function deleteLead(id: number) {
  await requireSession();
  await db.delete(leads).where(eq(leads.id, id));
  revalidatePath("/leads");
}

/** Zet een lead om naar een klant, start onboarding en markeert de lead als deal. */
export async function convertLeadToClient(id: number) {
  await requireSession();
  const [lead] = await db.select().from(leads).where(eq(leads.id, id));
  if (!lead) redirect("/leads");

  const [created] = await db
    .insert(clients)
    .values({
      bedrijf: lead.bedrijf,
      contactpersoon: lead.contactpersoon,
      email: lead.email,
      telefoon: lead.telefoon,
      websiteUrl: lead.demoUrl, // de demo als startpunt
      status: "onboarding",
      notities: lead.notities,
    })
    .returning({ id: clients.id });

  await seedChecklist(created.id);
  await db.update(leads).set({ status: "deal" }).where(eq(leads.id, id));

  revalidatePath("/leads");
  revalidatePath("/");
  redirect(`/klanten/${created.id}`);
}
