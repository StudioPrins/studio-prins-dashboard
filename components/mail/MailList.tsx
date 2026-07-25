"use client";

import { useState, useTransition } from "react";
import { CategoryBadge } from "./CategoryBadge";
import { MailDetailModal } from "./MailDetailModal";
import {
  deleteMessagesBulkAction,
  ignoreMessagesBulkAction,
} from "@/lib/actions/mail";
import type { MailRowView } from "@/lib/queries";

export function MailList({ messages }: { messages: MailRowView[] }) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [openId, setOpenId] = useState<number | null>(null);
  const [pending, start] = useTransition();

  if (messages.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-lg font-medium">Geen mail in deze weergave</p>
        <p className="mt-1 text-sm text-muted">
          Klik op “Synchroniseer” om nieuwe mail op te halen, of kies een andere categorie.
        </p>
      </div>
    );
  }

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const clear = () => setSelected(new Set());

  const bulkDelete = () =>
    start(async () => {
      await deleteMessagesBulkAction([...selected]);
      clear();
    });
  const bulkIgnore = () =>
    start(async () => {
      await ignoreMessagesBulkAction([...selected]);
      clear();
    });

  const openMessage = messages.find((m) => m.id === openId) ?? null;

  return (
    <>
      {selected.size > 0 && (
        <div className="card flex items-center gap-2 px-4 py-2.5 mb-3 sticky top-2 z-10">
          <span className="text-sm font-medium">{selected.size} geselecteerd</span>
          <div className="ml-auto flex items-center gap-2">
            <button className="btn btn-secondary text-xs px-2.5 py-1.5" disabled={pending} onClick={bulkIgnore}>
              Negeer selectie
            </button>
            <button className="btn btn-danger text-xs px-2.5 py-1.5" disabled={pending} onClick={bulkDelete}>
              Verwijder selectie
            </button>
            <button className="btn btn-ghost text-xs px-2.5 py-1.5" onClick={clear}>
              Wis selectie
            </button>
          </div>
        </div>
      )}

      <div className="card divide-y divide-line overflow-hidden" style={{ opacity: pending ? 0.6 : 1 }}>
        {messages.map((m) => (
          <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2">
            <input
              type="checkbox"
              checked={selected.has(m.id)}
              onChange={() => toggle(m.id)}
              onClick={(e) => e.stopPropagation()}
              aria-label="Selecteer"
            />
            <button
              className="flex-1 min-w-0 text-left flex flex-col gap-0.5"
              onClick={() => setOpenId(m.id)}
            >
              <div className="flex items-center gap-2">
                <CategoryBadge category={m.category} />
                <span className="text-xs text-muted truncate">{m.accountNaam}</span>
                <span className="text-xs text-muted ml-auto whitespace-nowrap">
                  {m.date ? new Date(m.date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" }) : ""}
                </span>
              </div>
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-sm font-medium truncate max-w-[220px]">
                  {m.fromName || m.fromAddress || "onbekend"}
                </span>
                <span className="text-sm truncate">{m.subject || "(geen onderwerp)"}</span>
              </div>
              {m.snippet && <p className="text-xs text-muted truncate">{m.snippet}</p>}
            </button>
          </div>
        ))}
      </div>

      {openMessage && (
        <MailDetailModal message={openMessage} open onClose={() => setOpenId(null)} />
      )}
    </>
  );
}
