"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { createUur, type FormState } from "@/lib/actions/uren";
import { TEAM } from "@/lib/uren";
import { toISODate } from "@/lib/format";

const initial: FormState = {};

export function UrenFormModal({
  klanten,
  standaardMedewerker,
}: {
  klanten: { id: number; bedrijf: string }[];
  standaardMedewerker: string;
}) {
  const [open, setOpen] = useState(false);
  // Telt op na elke succesvolle toevoeging en reset via `key` de formuliervelden.
  const [ronde, setRonde] = useState(0);
  const vandaag = toISODate();

  // Sluiten gebeurt in de actie zelf, niet in een effect: zo is er geen extra
  // renderronde nodig en blijft de reset gekoppeld aan het gelukte opslaan.
  const [state, formAction, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const resultaat = await createUur(prev, fd);
    if (resultaat.ok) {
      setOpen(false);
      setRonde((n) => n + 1);
    }
    return resultaat;
  }, initial);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        + Uren toevoegen
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Uren toevoegen" width={560}>
        <form key={ronde} action={formAction} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label" htmlFor="doel">
                Waar heb je aan gewerkt?
              </label>
              <select id="doel" name="doel" className="input" defaultValue="">
                <option value="" disabled>
                  Kies een klant of bedrijfswerkzaamheden…
                </option>
                <option value="bedrijf">Bedrijfswerkzaamheden</option>
                <optgroup label="Klanten">
                  {klanten.map((k) => (
                    <option key={k.id} value={`klant:${k.id}`}>
                      {k.bedrijf}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="label" htmlFor="medewerker">
                Wie ben je?
              </label>
              <select
                id="medewerker"
                name="medewerker"
                className="input"
                defaultValue={standaardMedewerker}
              >
                <option value="" disabled>
                  Kies…
                </option>
                {TEAM.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.naam}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="uren">
                Aantal uren
              </label>
              <input
                id="uren"
                name="uren"
                className="input"
                inputMode="decimal"
                placeholder="bv. 2,5"
                autoComplete="off"
              />
            </div>

            <div className="col-span-2">
              <label className="label" htmlFor="datum">
                Datum
              </label>
              <input
                id="datum"
                name="datum"
                type="date"
                className="input"
                defaultValue={vandaag}
                max={vandaag}
              />
            </div>

            <div className="col-span-2">
              <label className="label" htmlFor="omschrijving">
                Wat heb je gedaan?
              </label>
              <textarea
                id="omschrijving"
                name="omschrijving"
                className="input"
                rows={3}
                placeholder="bv. Homepage responsive gemaakt en teksten nagelopen"
              />
            </div>
          </div>

          {state.error && (
            <p
              className="text-sm rounded-[10px] px-3 py-2"
              style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
            >
              {state.error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
              Annuleren
            </button>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "Opslaan…" : "Toevoegen"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
