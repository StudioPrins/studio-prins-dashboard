"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import {
  createMailAccount,
  updateMailAccount,
  type FormState,
} from "@/lib/actions/mail-accounts";
import type { MailAccountView } from "@/lib/db/schema";

const initial: FormState = {};

function toDateInput(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
}
function todayInput(): string {
  return toDateInput(new Date());
}

export function AccountFormModal({
  mode,
  account,
  triggerLabel,
  triggerClass = "btn btn-primary",
}: {
  mode: "create" | "edit";
  account?: MailAccountView;
  triggerLabel: string;
  triggerClass?: string;
}) {
  const [open, setOpen] = useState(false);
  const action =
    mode === "edit" && account
      ? updateMailAccount.bind(null, account.id)
      : createMailAccount;
  const [state, formAction, pending] = useActionState(action, initial);

  // Sluit de modal zodra de actie geslaagd is. Bewust tijdens de render in
  // plaats van in een effect: useActionState geeft bij elke submit een nieuw
  // object terug, dus dit vuurt precies één keer per resultaat.
  const [vorigResultaat, setVorigResultaat] = useState(state);
  if (state !== vorigResultaat) {
    setVorigResultaat(state);
    if (state.ok) setOpen(false);
  }

  return (
    <>
      <button className={triggerClass} onClick={() => setOpen(true)}>
        {triggerLabel}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={mode === "edit" ? "Account bewerken" : "Mailaccount toevoegen"}
        width={640}
      >
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Naam (label)" name="naam" defaultValue={account?.naam} required placeholder="Studio Prins info" />
            <Field label="E-mailadres" name="email" type="email" defaultValue={account?.email} required placeholder="info@studioprins.nl" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Gebruikersnaam" name="username" defaultValue={account?.username} placeholder="gelijk aan e-mail (leeg = e-mail)" />
            <Field
              label={mode === "edit" ? "Wachtwoord (leeg = ongewijzigd)" : "Wachtwoord"}
              name="password"
              type="password"
              required={mode === "create"}
              placeholder="••••••••"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
            <Field label="IMAP-host" name="imapHost" defaultValue={account?.imapHost} required placeholder="mail.hosting.nl" />
            <Field label="IMAP-poort" name="imapPort" type="number" defaultValue={String(account?.imapPort ?? 993)} className="sm:w-28" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-4 items-end">
            <Field label="SMTP-host" name="smtpHost" defaultValue={account?.smtpHost} required placeholder="mail.hosting.nl" />
            <Field label="SMTP-poort" name="smtpPort" type="number" defaultValue={String(account?.smtpPort ?? 465)} className="sm:w-28" />
            <label className="flex items-center gap-2 text-sm pb-2.5">
              <input type="checkbox" name="smtpSecure" defaultChecked={account?.smtpSecure ?? true} />
              SSL/TLS
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Verzonden-map (optioneel)" name="sentFolder" defaultValue={account?.sentFolder ?? ""} placeholder="auto-detectie" />
            <Field label="Prullenbak-map (optioneel)" name="trashFolder" defaultValue={account?.trashFolder ?? ""} placeholder="auto-detectie" />
          </div>

          <Field
            label="Synchroniseer vanaf"
            name="syncSince"
            type="date"
            defaultValue={account?.syncSince ? toDateInput(account.syncSince) : todayInput()}
            className="sm:w-52"
          />

          <p className="text-xs text-muted">
            Mappen worden automatisch gedetecteerd bij het opslaan of testen. Vul ze
            alleen in als detectie niet lukt. Mails van vóór de synchronisatiedatum worden
            nooit opgehaald; leeg laten = geen ondergrens.
          </p>

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
              {pending ? "Opslaan…" : mode === "edit" ? "Opslaan" : "Account toevoegen"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  placeholder,
  className = "",
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-sm font-medium">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className="input"
      />
    </label>
  );
}
