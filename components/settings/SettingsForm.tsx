"use client";

import { useActionState, useEffect, useState } from "react";
import { updateCompanySettings, type FormState } from "@/lib/actions/settings";
import type { Bedrijf } from "@/lib/queries";

const initial: FormState = {};

export function SettingsForm({ bedrijf }: { bedrijf: Bedrijf }) {
  const [state, action, pending] = useActionState(updateCompanySettings, initial);
  const [saved, setSaved] = useState(false);

  // Toon "opgeslagen" zodra er een geslaagd resultaat binnenkomt. Tijdens de
  // render in plaats van in een effect; useActionState levert per submit een
  // nieuw object, dus dit vuurt precies één keer.
  const [vorigResultaat, setVorigResultaat] = useState(state);
  if (state !== vorigResultaat) {
    setVorigResultaat(state);
    setSaved(state.ok === true);
  }

  // Het weer laten verdwijnen is wél effectwerk: een timer is een extern systeem.
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(t);
  }, [saved]);

  return (
    <form action={action} className="flex flex-col gap-8">
      <section className="card p-6">
        <h2 className="font-semibold tracking-tight mb-1">Algemeen</h2>
        <p className="text-sm text-muted mb-5">Naam en contactgegevens zoals ze op de factuur komen.</p>
        <div className="grid grid-cols-2 gap-4">
          <Field name="naam" label="Bedrijfsnaam" def={bedrijf.naam} />
          <Field name="tagline" label="Tagline" def={bedrijf.tagline} />
          <Field name="email" label="E-mail" def={bedrijf.email} />
          <Field name="telefoon" label="Telefoon" def={bedrijf.telefoon} placeholder="+31 6 …" />
          <Field name="website" label="Website" def={bedrijf.website} />
        </div>
      </section>

      <section className="card p-6">
        <h2 className="font-semibold tracking-tight mb-1">Adres</h2>
        <p className="text-sm text-muted mb-5">Vestigingsadres van Studio Prins.</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field name="adres" label="Straat en huisnummer" def={bedrijf.adres} placeholder="Voorbeeldstraat 1" />
          </div>
          <Field name="postcode" label="Postcode" def={bedrijf.postcode} placeholder="3011 AB" />
          <Field name="plaats" label="Plaats" def={bedrijf.plaats} placeholder="Rotterdam" />
        </div>
      </section>

      <section className="card p-6">
        <h2 className="font-semibold tracking-tight mb-1">Wettelijke gegevens</h2>
        <p className="text-sm text-muted mb-5">
          KVK-nummer, btw-id en IBAN zijn wettelijk verplicht op een factuur.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Field name="kvk" label="KVK-nummer" def={bedrijf.kvk} placeholder="12345678" />
          <Field name="btw" label="Btw-id" def={bedrijf.btw} placeholder="NL001234567B01" />
          <Field name="iban" label="IBAN" def={bedrijf.iban} placeholder="NL00 BANK 0123 4567 89" />
          <Field name="tenaamstelling" label="Tenaamstelling (indien afwijkend)" def={bedrijf.tenaamstelling} />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Opslaan…" : "Gegevens opslaan"}
        </button>
        {saved && <span className="text-sm" style={{ color: "var(--success)" }}>Opgeslagen ✓</span>}
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  def,
  placeholder,
}: {
  name: string;
  label: string;
  def: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input name={name} defaultValue={def} className="input" placeholder={placeholder} />
    </div>
  );
}
