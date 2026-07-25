"use client";

import { useRef, useState, useTransition } from "react";
import {
  addTemplateItem,
  renameTemplateItem,
  deleteTemplateItem,
  moveTemplateItem,
} from "@/lib/actions/checklist-template";
import type { ChecklistTemplateItem } from "@/lib/db/schema";

export function ChecklistTemplateEditor({ items }: { items: ChecklistTemplateItem[] }) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    const titel = inputRef.current?.value.trim();
    if (!titel) return;
    startTransition(async () => {
      await addTemplateItem(titel);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function remove(id: number) {
    startTransition(async () => {
      await deleteTemplateItem(id);
    });
  }

  function move(id: number, richting: "up" | "down") {
    startTransition(async () => {
      await moveTemplateItem(id, richting);
    });
  }

  function saveRename(id: number, titel: string) {
    const clean = titel.trim();
    setEditingId(null);
    if (!clean) return;
    startTransition(async () => {
      await renameTemplateItem(id, clean);
    });
  }

  return (
    <section className="card p-6">
      <h2 className="font-semibold tracking-tight mb-1">Onboarding-checklist</h2>
      <p className="text-sm text-muted mb-5">
        Deze punten krijgt elke nieuwe klant automatisch als checklist. Wijzigingen gelden
        voor nieuwe klanten; bestaande klanten houden hun eigen lijst.
      </p>

      <ul className="flex flex-col">
        {items.length === 0 && (
          <li className="text-sm text-muted py-2">Nog geen punten. Voeg er hieronder een toe.</li>
        )}
        {items.map((item, i) => (
          <li
            key={item.id}
            className="group flex items-center gap-2 py-2 border-b border-line last:border-0"
          >
            <span className="text-xs text-muted w-5 shrink-0 tabular-nums">{i + 1}.</span>

            {editingId === item.id ? (
              <input
                autoFocus
                defaultValue={item.titel}
                className="input flex-1 min-w-0 py-1 h-8"
                onBlur={(e) => saveRename(item.id, e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveRename(item.id, e.currentTarget.value);
                  if (e.key === "Escape") setEditingId(null);
                }}
              />
            ) : (
              <button
                onClick={() => setEditingId(item.id)}
                className="text-left flex-1 min-w-0 text-sm text-ink"
              >
                <span className="truncate block">{item.titel}</span>
              </button>
            )}

            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <IconButton label="Omhoog" disabled={i === 0} onClick={() => move(item.id, "up")}>
                <path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </IconButton>
              <IconButton
                label="Omlaag"
                disabled={i === items.length - 1}
                onClick={() => move(item.id, "down")}
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </IconButton>
              <IconButton label="Hernoemen" onClick={() => setEditingId(item.id)}>
                <path
                  d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </IconButton>
              <IconButton label="Verwijderen" danger onClick={() => remove(item.id)}>
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
        <input ref={inputRef} className="input" placeholder="Checklistpunt toevoegen…" />
        <button type="submit" className="btn btn-secondary" disabled={isPending}>
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
