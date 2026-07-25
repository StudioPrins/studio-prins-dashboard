"use client";

import { useActionState, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ClientFields } from "./ClientFields";
import { createClient, updateClient, type FormState } from "@/lib/actions/clients";
import type { Client } from "@/lib/db/schema";

const initial: FormState = {};

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
  const action =
    mode === "edit" && client
      ? updateClient.bind(null, client.id)
      : createClient;
  const [state, formAction, pending] = useActionState(action, initial);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <>
      <button className={triggerClass} onClick={() => setOpen(true)}>
        {triggerLabel}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={mode === "edit" ? "Klant bewerken" : "Nieuwe klant"}
        width={640}
      >
        <form action={formAction} className="flex flex-col gap-5">
          <ClientFields client={client} minimal={mode === "create"} />
          {state.error && (
            <p
              className="text-sm rounded-[10px] px-3 py-2"
              style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
            >
              {state.error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setOpen(false)}
            >
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
            De onboarding-checklist wordt automatisch aangemaakt. Daarna kun je met één klik
            de onboardingmail met intakeformulier versturen.
          </p>
        )}
      </Modal>
    </>
  );
}
