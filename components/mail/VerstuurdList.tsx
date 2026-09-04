"use client";

import { useState } from "react";
import { MailDetailModal } from "./MailDetailModal";
import { editRatio, isMeaningfulEdit } from "@/lib/mail/diff";
import type { MailRowView } from "@/lib/queries";

/**
 * Beantwoorde mails. Bewust een eigen lijst en niet MailList: hier is niets te
 * selecteren of in bulk af te handelen — het gaat om terugkijken op wat je van
 * de concepten maakte.
 */
export function VerstuurdList({ messages }: { messages: MailRowView[] }) {
  const [openId, setOpenId] = useState<number | null>(null);

  if (messages.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-lg font-medium">Nog niets verstuurd</p>
        <p className="mt-1 text-sm text-muted">
          Zodra je een concept beantwoordt, zie je hier wat je eraan aanpaste.
        </p>
      </div>
    );
  }

  const openMessage = messages.find((m) => m.id === openId) ?? null;

  return (
    <>
      <div className="card divide-y divide-line overflow-hidden">
        {messages.map((m) => (
          <button
            key={m.id}
            className="w-full text-left flex flex-col gap-0.5 px-4 py-3 hover:bg-surface-2"
            onClick={() => setOpenId(m.id)}
          >
            <div className="flex items-center gap-2">
              <AanpassingBadge message={m} />
              <span className="text-xs text-muted truncate">{m.accountNaam}</span>
              <span className="text-xs text-muted ml-auto whitespace-nowrap">
                {m.sentAt
                  ? new Date(m.sentAt).toLocaleDateString("nl-NL", {
                      day: "numeric",
                      month: "short",
                    })
                  : ""}
              </span>
            </div>
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-sm font-medium truncate max-w-[220px]">
                {m.fromName || m.fromAddress || "onbekend"}
              </span>
              <span className="text-sm truncate">{m.subject || "(geen onderwerp)"}</span>
            </div>
            {m.sentBody && (
              <p className="text-xs text-muted truncate">{m.sentBody.replace(/\s+/g, " ")}</p>
            )}
          </button>
        ))}
      </div>

      {openMessage && (
        <MailDetailModal message={openMessage} open onClose={() => setOpenId(null)} />
      )}
    </>
  );
}

/** Hoeveel er aan het concept veranderde, in één oogopslag. */
function AanpassingBadge({ message }: { message: MailRowView }) {
  const stijl = (bg: string, kleur: string, tekst: string) => (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap"
      style={{ background: bg, color: kleur }}
    >
      {tekst}
    </span>
  );

  if (!message.aiDraft || !message.sentBody) {
    return stijl("var(--surface-2)", "var(--ink-soft)", "Zelf geschreven");
  }
  if (!isMeaningfulEdit(message.aiDraft, message.sentBody)) {
    return stijl("var(--success-soft)", "var(--success)", "Ongewijzigd");
  }
  const procent = Math.round(editRatio(message.aiDraft, message.sentBody) * 100);
  return stijl("var(--amber-soft)", "var(--amber)", `${procent}% aangepast`);
}
