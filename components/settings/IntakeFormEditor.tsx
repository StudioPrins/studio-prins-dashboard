"use client";

import { useRef, useState, useTransition } from "react";
import {
  addIntakeField,
  renameIntakeField,
  deleteIntakeField,
  moveIntakeField,
  setIntakeFieldSoort,
  setIntakeFieldPlaceholder,
} from "@/lib/actions/intake-fields";
import { BILLING_FIELDS, type IntakeSoort } from "@/lib/intake-fields";
import type { IntakeFieldRow } from "@/lib/db/schema";

type Bewerking = { id: number; veld: "label" | "placeholder" } | null;

export function IntakeFormEditor({ fields }: { fields: IntakeFieldRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [bewerking, setBewerking] = useState<Bewerking>(null);
  const labelRef = useRef<HTMLInputElement>(null);
  const soortRef = useRef<HTMLSelectElement>(null);

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    const label = labelRef.current?.value.trim();
    if (!label) return;
    const soort = (soortRef.current?.value ?? "tekst") as IntakeSoort;
    startTransition(async () => {
      await addIntakeField(label, soort);
      if (labelRef.current) labelRef.current.value = "";
    });
  }

  function saveLabel(id: number, waarde: string) {
    setBewerking(null);
    const clean = waarde.trim();
    if (!clean) return;
    startTransition(async () => {
      await renameIntakeField(id, clean);
    });
  }

  function savePlaceholder(id: number, waarde: string) {
    setBewerking(null);
    startTransition(async () => {
      await setIntakeFieldPlaceholder(id, waarde);
    });
  }

  return (
    <section className="card p-6">
      <h2 className="font-semibold tracking-tight mb-1">Intakeformulier</h2>
      <p className="text-sm text-muted mb-5">
        De vragen die klanten beantwoorden via de link in de onboardingmail. Klik op een
        vraag om 'm te hernoemen. Wijzigingen gelden meteen voor alle openstaande formulieren;
        eerder gegeven antwoorden blijven bewaard.
      </p>

      <h3 className="text-sm font-medium text-muted mb-2">Bedrijfsgegevens — altijd gevraagd</h3>
      <p className="text-sm text-muted mb-3">
        Deze velden liggen vast: ze vullen de klantgegevens die op de facturen komen.
      </p>
      <div className="flex flex-wrap gap-1.5 mb-7">
        {BILLING_FIELDS.map((f) => (
          <span
            key={f.name}
            className="text-xs rounded-full px-2.5 py-1"
            style={{ background: "var(--surface-2)", color: "var(--ink-soft)" }}
          >
            {f.label}
          </span>
        ))}
      </div>

      <h3 className="text-sm font-medium text-muted mb-2">Wensen voor de website — zelf aanpasbaar</h3>

      <ul className="flex flex-col">
        {fields.length === 0 && (
          <li className="text-sm text-muted py-2">
            Nog geen vragen. Voeg er hieronder een toe.
          </li>
        )}
        {fields.map((f, i) => (
          <li
            key={f.id}
            className="group flex items-start gap-2 py-2.5 border-b border-line last:border-0"
          >
            <span className="text-xs text-muted w-5 shrink-0 tabular-nums pt-1.5">{i + 1}.</span>

            <div className="flex-1 min-w-0">
              {bewerking?.id === f.id && bewerking.veld === "label" ? (
                <input
                  autoFocus
                  defaultValue={f.label}
                  className="input w-full py-1 h-8"
                  onBlur={(e) => saveLabel(f.id, e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveLabel(f.id, e.currentTarget.value);
                    if (e.key === "Escape") setBewerking(null);
                  }}
                />
              ) : (
                <button
                  onClick={() => setBewerking({ id: f.id, veld: "label" })}
                  className="text-left w-full text-sm text-ink"
                >
                  <span className="truncate block">{f.label}</span>
                </button>
              )}

              {bewerking?.id === f.id && bewerking.veld === "placeholder" ? (
                <input
                  autoFocus
                  defaultValue={f.placeholder ?? ""}
                  placeholder="Voorbeeldtekst in het lege veld…"
                  className="input w-full py-1 h-8 mt-1.5"
                  onBlur={(e) => savePlaceholder(f.id, e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") savePlaceholder(f.id, e.currentTarget.value);
                    if (e.key === "Escape") setBewerking(null);
                  }}
                />
              ) : (
                <button
                  onClick={() => setBewerking({ id: f.id, veld: "placeholder" })}
                  className="text-left w-full text-xs text-muted mt-0.5 hover:text-ink transition-colors"
                >
                  {f.placeholder || <span className="italic">Voorbeeldtekst toevoegen…</span>}
                </button>
              )}
            </div>

            <select
              value={f.soort}
              onChange={(e) =>
                startTransition(async () => {
                  await setIntakeFieldSoort(f.id, e.target.value as IntakeSoort);
                })
              }
              className="input h-8 py-0 text-xs w-[112px] shrink-0"
              aria-label="Soort veld"
            >
              <option value="tekst">Kort veld</option>
              <option value="tekstvak">Tekstvak</option>
            </select>

            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
              <IconButton label="Omhoog" disabled={i === 0} onClick={() => startTransition(async () => { await moveIntakeField(f.id, "up"); })}>
                <path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </IconButton>
              <IconButton
                label="Omlaag"
                disabled={i === fields.length - 1}
                onClick={() => startTransition(async () => { await moveIntakeField(f.id, "down"); })}
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </IconButton>
              <IconButton label="Hernoemen" onClick={() => setBewerking({ id: f.id, veld: "label" })}>
                <path
                  d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </IconButton>
              <IconButton
                label="Verwijderen"
                danger
                onClick={() => startTransition(async () => { await deleteIntakeField(f.id); })}
              >
                <path
                  d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </IconButton>
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={onAdd} className="mt-4 flex gap-2">
        <input ref={labelRef} className="input flex-1" placeholder="Vraag toevoegen…" />
        <select ref={soortRef} defaultValue="tekst" className="input w-[130px] shrink-0">
          <option value="tekst">Kort veld</option>
          <option value="tekstvak">Tekstvak</option>
        </select>
        <button type="submit" className="btn btn-secondary shrink-0" disabled={isPending}>
          Toevoegen
        </button>
      </form>
    </section>
  );
}

function IconButton({
  label,
  children,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`grid place-items-center w-7 h-7 rounded-md transition-colors disabled:opacity-30 ${
        danger ? "text-muted hover:text-danger" : "text-muted hover:text-ink"
      } hover:bg-surface-2`}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        {children}
      </svg>
    </button>
  );
}
