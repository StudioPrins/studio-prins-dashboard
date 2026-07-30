"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { CategoryBadge } from "./CategoryBadge";
import { MailDetailModal } from "./MailDetailModal";
import {
  deleteMessagesBulkAction,
  ignoreMessagesBulkAction,
  deleteCategoryAction,
  ignoreCategoryAction,
} from "@/lib/actions/mail";
import type { MailRowView } from "@/lib/queries";

export function MailList({
  messages,
  filter,
  totalInView,
  categoryLabel,
}: {
  messages: MailRowView[];
  filter: { categorie?: string; accountId?: number };
  totalInView: number;
  categoryLabel?: string;
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [allInCategory, setAllInCategory] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const headerRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setSelected(new Set());
    setAllInCategory(false);
  };

  useEffect(() => {
    if (headerRef.current) {
      headerRef.current.indeterminate =
        !allInCategory && selected.size > 0 && selected.size < messages.length;
    }
  }, [selected, allInCategory, messages.length]);

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

  const toggle = (id: number) => {
    setAllInCategory(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allVisibleSelected = selected.size === messages.length;
  const moreThanShown = !!filter.categorie && totalInView > messages.length;

  const toggleAllVisible = () => {
    if (allVisibleSelected) reset();
    else {
      setSelected(new Set(messages.map((m) => m.id)));
      setAllInCategory(false);
    }
  };

  const label = categoryLabel ?? "deze categorie";
  const selCount = allInCategory ? totalInView : selected.size;

  const runDelete = () => {
    if (allInCategory) {
      if (
        !window.confirm(
          `Weet je zeker dat je alle ${totalInView} mails in ${label} naar de prullenbak verplaatst?`
        )
      )
        return;
      start(async () => {
        await deleteCategoryAction(filter);
        reset();
      });
    } else {
      const ids = [...selected];
      start(async () => {
        await deleteMessagesBulkAction(ids);
        reset();
      });
    }
  };

  const runIgnore = () => {
    if (allInCategory) {
      start(async () => {
        await ignoreCategoryAction(filter);
        reset();
      });
    } else {
      const ids = [...selected];
      start(async () => {
        await ignoreMessagesBulkAction(ids);
        reset();
      });
    }
  };

  const openMessage = messages.find((m) => m.id === openId) ?? null;

  return (
    <>
      {selCount > 0 && (
        <div className="card flex items-center gap-2 px-4 py-2.5 mb-3 sticky top-2 z-10">
          <span className="text-sm font-medium">{selCount} geselecteerd</span>
          <div className="ml-auto flex items-center gap-2">
            <button className="btn btn-secondary text-xs px-2.5 py-1.5" disabled={pending} onClick={runIgnore}>
              {allInCategory ? `Negeer alle ${totalInView}` : "Negeer selectie"}
            </button>
            <button className="btn btn-danger text-xs px-2.5 py-1.5" disabled={pending} onClick={runDelete}>
              {allInCategory ? `Verwijder alle ${totalInView}` : "Verwijder selectie"}
            </button>
            <button className="btn btn-ghost text-xs px-2.5 py-1.5" onClick={reset}>
              Wis selectie
            </button>
          </div>
        </div>
      )}

      {/* Hele-categorie-banner (Gmail-patroon): alleen als alle zichtbare zijn geselecteerd
          én er meer buiten de getoonde lijst staan. */}
      {allVisibleSelected && moreThanShown && (
        <div className="card px-4 py-2.5 mb-3 text-sm text-center" style={{ background: "var(--accent-soft)", color: "var(--accent-ink)" }}>
          {allInCategory ? (
            <>Alle <strong>{totalInView}</strong> mails in {label} zijn geselecteerd.</>
          ) : (
            <>
              Alle {messages.length} mails op deze pagina zijn geselecteerd.{" "}
              <button className="underline font-medium" onClick={() => setAllInCategory(true)}>
                Selecteer alle {totalInView} in {label}
              </button>
            </>
          )}
        </div>
      )}

      <div className="card divide-y divide-line overflow-hidden" style={{ opacity: pending ? 0.6 : 1 }}>
        <div className="flex items-center gap-3 px-4 py-2 bg-surface-2">
          <input
            ref={headerRef}
            type="checkbox"
            checked={allVisibleSelected}
            onChange={toggleAllVisible}
            aria-label="Selecteer alle zichtbare"
          />
          <span className="text-xs text-muted">Selecteer alles op deze pagina</span>
        </div>
        {messages.map((m) => (
          <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2">
            <input
              type="checkbox"
              checked={allInCategory || selected.has(m.id)}
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
