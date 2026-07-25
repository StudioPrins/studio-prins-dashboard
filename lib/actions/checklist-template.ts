"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { checklistTemplate } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth";

/**
 * Beheer van het onboarding-hoofdsjabloon. Deze punten bepalen welke taken een
 * nieuwe klant automatisch krijgt (zie seedChecklist).
 */

export async function addTemplateItem(titel: string) {
  await requireSession();
  const clean = titel.trim();
  if (!clean) return;
  const rows = await db
    .select({ volgorde: checklistTemplate.volgorde })
    .from(checklistTemplate);
  const maxOrder = rows.reduce((m, r) => Math.max(m, r.volgorde), -1);
  await db.insert(checklistTemplate).values({ titel: clean, volgorde: maxOrder + 1 });
  revalidatePath("/instellingen");
}

export async function renameTemplateItem(id: number, titel: string) {
  await requireSession();
  const clean = titel.trim();
  if (!clean) return;
  await db.update(checklistTemplate).set({ titel: clean }).where(eq(checklistTemplate.id, id));
  revalidatePath("/instellingen");
}

export async function deleteTemplateItem(id: number) {
  await requireSession();
  await db.delete(checklistTemplate).where(eq(checklistTemplate.id, id));
  revalidatePath("/instellingen");
}

/** Verschuift een sjabloonpunt omhoog/omlaag door de volgorde met de buur te wisselen. */
export async function moveTemplateItem(id: number, richting: "up" | "down") {
  await requireSession();
  const rows = await db
    .select({ id: checklistTemplate.id, volgorde: checklistTemplate.volgorde })
    .from(checklistTemplate)
    .orderBy(asc(checklistTemplate.volgorde), asc(checklistTemplate.id));

  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return;
  const swapIdx = richting === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= rows.length) return;

  const a = rows[idx];
  const b = rows[swapIdx];
  await db.update(checklistTemplate).set({ volgorde: b.volgorde }).where(eq(checklistTemplate.id, a.id));
  await db.update(checklistTemplate).set({ volgorde: a.volgorde }).where(eq(checklistTemplate.id, b.id));

  revalidatePath("/instellingen");
}
