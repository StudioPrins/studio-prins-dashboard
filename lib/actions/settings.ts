"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { companySettings } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth";

export type FormState = { error?: string; ok?: boolean };

function str(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

/** Slaat de eigen bedrijfsgegevens op (upsert op de vaste rij id=1). */
export async function updateCompanySettings(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireSession();

  const values = {
    id: 1,
    naam: str(formData.get("naam")),
    tagline: str(formData.get("tagline")),
    email: str(formData.get("email")),
    telefoon: str(formData.get("telefoon")),
    website: str(formData.get("website")),
    adres: str(formData.get("adres")),
    postcode: str(formData.get("postcode")),
    plaats: str(formData.get("plaats")),
    kvk: str(formData.get("kvk")),
    btw: str(formData.get("btw")),
    iban: str(formData.get("iban")),
    tenaamstelling: str(formData.get("tenaamstelling")),
  };

  await db
    .insert(companySettings)
    .values(values)
    .onConflictDoUpdate({
      target: companySettings.id,
      set: {
        naam: values.naam,
        tagline: values.tagline,
        email: values.email,
        telefoon: values.telefoon,
        website: values.website,
        adres: values.adres,
        postcode: values.postcode,
        plaats: values.plaats,
        kvk: values.kvk,
        btw: values.btw,
        iban: values.iban,
        tenaamstelling: values.tenaamstelling,
      },
    });

  // Facturen tonen deze gegevens → hun cache verversen.
  revalidatePath("/facturen", "layout");
  revalidatePath("/instellingen");
  return { ok: true };
}
