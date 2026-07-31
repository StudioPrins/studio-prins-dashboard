"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { uren } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth";
import { parseUren, TEAM_KEYS } from "@/lib/uren";
import { toISODate } from "@/lib/format";

export type FormState = { error?: string; ok?: boolean };

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

/** Maximaal één etmaal per registratie — vangt typfouten als "80" i.p.v. "8" op. */
const MAX_MINUTEN = 24 * 60;

export async function createUur(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireSession();

  // "bedrijf" of "klant:<id>"
  const doel = str(formData.get("doel"));
  let soort = "klant";
  let clientId: number | null = null;
  if (doel === "bedrijf") {
    soort = "bedrijf";
  } else if (doel.startsWith("klant:")) {
    const id = Number(doel.slice(6));
    if (!Number.isInteger(id) || id <= 0) return { error: "Kies een klant of bedrijfswerkzaamheden." };
    clientId = id;
  } else {
    return { error: "Kies een klant of bedrijfswerkzaamheden." };
  }

  const medewerker = str(formData.get("medewerker"));
  if (!TEAM_KEYS.includes(medewerker)) return { error: "Kies wie je bent." };

  const minuten = parseUren(str(formData.get("uren")));
  if (minuten === null) return { error: "Vul een geldig aantal uren in, bijvoorbeeld 2,5." };
  if (minuten <= 0) return { error: "Het aantal uren moet groter zijn dan nul." };
  if (minuten > MAX_MINUTEN) return { error: "Je kunt maximaal 24 uur per registratie boeken." };

  const vandaag = toISODate();
  const datum = str(formData.get("datum")) || vandaag;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum) || Number.isNaN(new Date(datum).getTime())) {
    return { error: "Vul een geldige datum in." };
  }
  if (datum > vandaag) return { error: "Je kunt geen uren in de toekomst boeken." };

  const omschrijving = str(formData.get("omschrijving"));
  if (!omschrijving) return { error: "Beschrijf kort wat je gedaan hebt." };

  await db.insert(uren).values({ clientId, soort, medewerker, datum, minuten, omschrijving });

  revalidatePath("/uren");
  return { ok: true };
}

export async function deleteUur(id: number) {
  await requireSession();
  await db.delete(uren).where(eq(uren.id, id));
  revalidatePath("/uren");
}
