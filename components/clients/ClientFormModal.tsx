"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ClientFields, type ClientFieldsVariant } from "./ClientFields";
import { createClient, updateClient, type FormState } from "@/lib/actions/clients";
import type { Client } from "@/lib/db/schema";

const initial: FormState = {};

/** Bij een nieuwe klant kiest de gebruiker eerst hoe die wordt aangemaakt. */
type Keuze = ClientFieldsVariant | null;

export function ClientFormModal({
  mode,
  client,
  triggerLabel,
  triggerClass = "btn btn-primary",
}: {
  mode: "create" | "edit";
  client?: Client;
  triggerLabel: string;
  triggerClass?: string;
}) {
  const [open, setOpen] = useState(false);
  // Bewerken slaat de keuzestap over en toont altijd alle velden.
  const [keuze, setKeuze] = useState<Keuze>(mode === "edit" ? "volledig" : null);

  const action =
    mode === "edit" && client
      ? updateClient.bind(null, client.id)
      : createClient;
  const [state, formAction, pending] = useActionState(action, initial);

  function close() {
    setOpen(false);
    if (mode === "create") setKeuze(null);
  }

  // Sluit de modal zodra de actie geslaagd is. Bewust tijdens de render in
  // plaats van in een effect: useActionState geeft bij elke submit een nieuw
  // object terug, dus dit vuurt precies één keer per resultaat.
  const [vorigResultaat, setVorigResultaat] = useState(state);
  if (state !== vorigResultaat) {
    setVorigResultaat(state);
    if (state.ok) close();
  }

  const titel =
    mode === "edit"
      ? "Klant bewerken"
      : keuze === "onboarden"
        ? "Nieuwe klant — onboarden"
        : keuze === "volledig"
          ? "Nieuwe klant — handmatig"
          : "Nieuwe klant";

  return (
    <>
      <button className={triggerClass} onClick={() => setOpen(true)}>
        {triggerLabel}
      </button>
      <Modal open={open} onClose={close} title={titel} width={keuze === "volledig" ? 720 : 640}>
        {keuze === null ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">
              Hoe wil je deze klant toevoegen?
            </p>
            <KeuzeKaart
              titel="Onboarden"
              omschrijving="Alleen de basis invullen. Daarna stuur je met één klik de onboardingmail met het intakeformulier en een eigen Google Drive-map."
              onClick={() => setKeuze("onboarden")}
            />
            <KeuzeKaart
              titel="Handmatig toevoegen"
              omschrijving="Vul zelf alle gegevens in, inclusief de facturatiegegevens. Voor klanten die je al kent of die alles al doorgegeven hebben."
              onClick={() => setKeuze("volledig")}
            />
          </div>
        ) : (
          <>
            <form action={formAction} className="flex flex-col gap-5">
              <ClientFields client={client} variant={keuze} />
              {state.error && (
                <p
                  className="text-sm rounded-[10px] px-3 py-2"
                  style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
                >
                  {state.error}
                </p>
              )}
              <div className="flex justify-end gap-2">
                {mode === "create" && (
                  <button
                    type="button"
                    className="btn btn-secondary mr-auto"
                    onClick={() => setKeuze(null)}
                  >
                    ← Terug
                  </button>
                )}
                <button type="button" className="btn btn-secondary" onClick={close}>
                  Annuleren
                </button>
                <button type="submit" className="btn btn-primary" disabled={pending}>
                  {pending
                    ? "Opslaan…"
                    : mode === "edit"
                      ? "Wijzigingen opslaan"
                      : "Klant aanmaken"}
                </button>
              </div>
            </form>
            {mode === "create" && (
              <p className="mt-3 text-xs text-muted">
                {keuze === "onboarden"
                  ? "De onboarding-checklist wordt automatisch aangemaakt. Op de klantpagina staat daarna de knop om de onboardingmail te versturen."
                  : "De onboarding-checklist wordt automatisch aangemaakt. Je kunt later alsnog de onboardingmail versturen."}
              </p>
            )}
          </>
        )}
      </Modal>
    </>
  );
}

function KeuzeKaart({
  titel,
  omschrijving,
  onClick,
}: {
  titel: string;
  omschrijving: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-[12px] border border-line p-4 transition-colors hover:border-accent hover:bg-surface-2"
    >
      <span className="flex items-center justify-between gap-3">
        <span className="font-medium text-ink">{titel}</span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="text-muted shrink-0"
        >
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="mt-1 block text-sm text-muted">{omschrijving}</span>
    </button>
  );
}
