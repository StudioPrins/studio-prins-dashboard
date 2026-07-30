"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { intakeFields } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth";
import { slugify, type IntakeSoort } from "@/lib/intake-fields";

/**
 * Beheer van de vragen op het intakeformulier (de websitewensen). De
 * bedrijfsgegevens staan vast en zitten hier bewust niet in.
 *
 * `naam` wordt alleen bij het toevoegen bepaald en verandert daarna nooit meer:
 * het is de sleutel waaronder het antwoord in `clients.intake` staat.
 */

/** Zorgt voor een unieke sleutel door er zo nodig een volgnummer achter te zetten. */
async function uniekeNaam(label: string): Promise<string> {
  const basis = slugify(label);
  const bestaand = new Set(
    (await db.select({ naam: intakeFields.naam }).from(intakeFields)).map((r) => r.naam)
  );
  if (!bestaand.has(basis)) return basis;
  let i = 2;
  while (bestaand.has(`${basis}_${i}`)) i++;
  return `${basis}_${i}`;
}

export async function addIntakeField(label: string, soort: IntakeSoort = "tekst") {
  await requireSession();
  const clean = label.trim();
  if (!clean) return;

  const rows = await db.select({ volgorde: intakeFields.volgorde }).from(intakeFields);
  const maxOrder = rows.reduce((m, r) => Math.max(m, r.volgorde), -1);

  await db.insert(intakeFields).values({
    naam: await uniekeNaam(clean),
    label: clean,
    soort,
    volgorde: maxOrder + 1,
  });
  revalidatePath("/instellingen");
}

/** Alleen het label; de sleutel blijft staan zodat bestaande antwoorden gekoppeld blijven. */
export async function renameIntakeField(id: number, label: string) {
  await requireSession();
  const clean = label.trim();
  if (!clean) return;
  await db.update(intakeFields).set({ label: clean }).where(eq(intakeFields.id, id));
  revalidatePath("/instellingen");
}

export async function setIntakeFieldSoort(id: number, soort: IntakeSoort) {
  await requireSession();
  await db.update(intakeFields).set({ soort }).where(eq(intakeFields.id, id));
  revalidatePath("/instellingen");
}

export async function setIntakeFieldPlaceholder(id: number, placeholder: string) {
  await requireSession();
  const clean = placeholder.trim();
  await db
    .update(intakeFields)
    .set({ placeholder: clean || null })
    .where(eq(intakeFields.id, id));
  revalidatePath("/instellingen");
}

/**
 * Verwijdert de vraag. Al gegeven antwoorden blijven in `clients.intake` staan
 * en worden op de klantpagina onder hun sleutelnaam getoond.
 */
export async function deleteIntakeField(id: number) {
  await requireSession();
  await db.delete(intakeFields).where(eq(intakeFields.id, id));
  revalidatePath("/instellingen");
}

/** Verschuift een vraag omhoog/omlaag door de volgorde met de buur te wisselen. */
export async function moveIntakeField(id: number, richting: "up" | "down") {
  await requireSession();
  const rows = await db
    .select({ id: intakeFields.id, volgorde: intakeFields.volgorde })
    .from(intakeFields)
    .orderBy(asc(intakeFields.volgorde), asc(intakeFields.id));

  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return;
  const swapIdx = richting === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= rows.length) return;

  const a = rows[idx];
  const b = rows[swapIdx];
  await db.update(intakeFields).set({ volgorde: b.volgorde }).where(eq(intakeFields.id, a.id));
  await db.update(intakeFields).set({ volgorde: a.volgorde }).where(eq(intakeFields.id, b.id));

  revalidatePath("/instellingen");
}
