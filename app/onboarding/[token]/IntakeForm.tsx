"use client";

import { useActionState } from "react";
import { submitIntake, type OnboardingState } from "@/lib/actions/onboarding";
import { BILLING_FIELDS, WEBSITE_FIELDS, type IntakeField } from "@/lib/intake-fields";

const initial: OnboardingState = {};

export function IntakeForm({
  token,
  billingDefaults,
  websiteDefaults,
  alreadySubmitted,
}: {
  token: string;
  billingDefaults: Record<string, string>;
  websiteDefaults: Record<string, string>;
  alreadySubmitted: boolean;
}) {
  const action = submitIntake.bind(null, token);
  const [state, formAction, pending] = useActionState(action, initial);

  if (state.ok) {
    return (
      <div className="rounded-[12px] border border-line p-6 text-center">
        <div
          className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full"
          style={{ background: "var(--success)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l4 4 10-10" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold tracking-tight">Bedankt, we hebben alles binnen!</h2>
        <p className="mt-1.5 text-sm text-muted">
          Je gegevens zijn verstuurd naar Studio Prins. We gaan voor je aan de slag en nemen
          binnenkort contact op. Je mag dit tabblad sluiten.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {alreadySubmitted && (
        <p
          className="text-sm rounded-[10px] px-3 py-2"
          style={{ background: "var(--surface-2)", color: "var(--ink-soft)" }}
        >
          Je hebt dit formulier al ingevuld. Je kunt hieronder aanpassen en opnieuw versturen.
        </p>
      )}

      <section>
        <h2 className="font-semibold tracking-tight mb-1">Bedrijfsgegevens</h2>
        <p className="text-sm text-muted mb-4">
          Voor onze administratie en de facturen. (KVK, btw en IBAN alleen als je die hebt.)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BILLING_FIELDS.map((f) => (
            <FieldInput key={f.name} field={f} def={billingDefaults[f.name] ?? ""} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold tracking-tight mb-1">Je wensen voor de website</h2>
        <p className="text-sm text-muted mb-4">Vertel ons wat je voor ogen hebt.</p>
        <div className="grid grid-cols-1 gap-4">
          {WEBSITE_FIELDS.map((f) => (
            <FieldInput key={f.name} field={f} def={websiteDefaults[f.name] ?? ""} />
          ))}
        </div>
      </section>

      {state.error && (
        <p
          className="text-sm rounded-[10px] px-3 py-2"
          style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
        >
          {state.error}
        </p>
      )}

      <div>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Versturen…" : "Versturen naar Studio Prins"}
        </button>
      </div>
    </form>
  );
}

function FieldInput({ field, def }: { field: IntakeField; def: string }) {
  return (
    <div className={field.textarea ? "" : ""}>
      <label className="label">{field.label}</label>
      {field.textarea ? (
        <textarea
          name={field.name}
          defaultValue={def}
          className="input"
          rows={3}
          placeholder={field.placeholder}
        />
      ) : (
        <input
          name={field.name}
          type={field.type ?? "text"}
          defaultValue={def}
          className="input"
          placeholder={field.placeholder}
        />
      )}
    </div>
  );
}
