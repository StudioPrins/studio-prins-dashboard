"use client";

import { useActionState, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { LeadFields } from "./LeadFields";
import { createLead, updateLead, type FormState } from "@/lib/actions/leads";
import type { Lead } from "@/lib/db/schema";

const initial: FormState = {};

export function LeadFormModal({
  mode,
  lead,
  triggerLabel,
  triggerClass = "btn btn-primary",
}: {
  mode: "create" | "edit";
  lead?: Lead;
  triggerLabel: string;
  triggerClass?: string;
}) {
  const [open, setOpen] = useState(false);
  const action = mode === "edit" && lead ? updateLead.bind(null, lead.id) : createLead;
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
        title={mode === "edit" ? "Lead bewerken" : "Nieuwe lead"}
        width={600}
      >
        <form action={formAction} className="flex flex-col gap-5">
          <LeadFields lead={lead} />
          {state.error && (
            <p className="text-sm rounded-[10px] px-3 py-2" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
              {state.error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
              Annuleren
            </button>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "Opslaan…" : mode === "edit" ? "Opslaan" : "Lead toevoegen"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
