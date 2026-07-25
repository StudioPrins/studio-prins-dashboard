"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  generateDraftAction,
  sendReplyAction,
  type SendState,
} from "@/lib/actions/mail";
import type { MailRowView } from "@/lib/queries";

const initial: SendState = {};

export function DraftPanel({
  message,
  onSent,
}: {
  message: MailRowView;
  onSent: () => void;
}) {
  const [draft, setDraft] = useState(message.aiDraft ?? "");
  const [genPending, startGen] = useTransition();
  const [genError, setGenError] = useState<string | null>(null);

  const [state, formAction, sendPending] = useActionState(
    sendReplyAction.bind(null, message.id),
    initial
  );

  useEffect(() => {
    if (state.ok && !state.warning) onSent();
  }, [state.ok, state.warning, onSent]);

  const generate = () =>
    startGen(async () => {
      setGenError(null);
      const res = await generateDraftAction(message.id);
      if (res.error) setGenError(res.error);
      else if (res.draft != null) setDraft(res.draft);
    });

  return (
    <div className="mt-4 border-t border-line pt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Conceptantwoord</h3>
        <button
          type="button"
          className="btn btn-secondary text-xs px-2.5 py-1.5"
          disabled={genPending}
          onClick={generate}
        >
          {genPending
            ? "Genereren…"
            : draft
              ? "Opnieuw genereren"
              : "Genereer concept"}
        </button>
      </div>

      {genError && (
        <p className="text-sm rounded-[10px] px-3 py-2 mb-2" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
          {genError}
        </p>
      )}

      <form action={formAction} className="flex flex-col gap-3">
        <textarea
          name="body"
          rows={10}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Genereer een concept of typ zelf een antwoord…"
          className="input font-normal"
          style={{ resize: "vertical" }}
        />

        {state.error && (
          <p className="text-sm rounded-[10px] px-3 py-2" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
            {state.error}
          </p>
        )}
        {state.warning && (
          <p className="text-sm rounded-[10px] px-3 py-2" style={{ background: "var(--amber-soft)", color: "var(--amber)" }}>
            {state.warning}
          </p>
        )}

        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-muted mr-auto">
            Verstuurd vanaf {message.accountEmail} naar {message.fromAddress}
          </span>
          <button type="submit" className="btn btn-primary" disabled={sendPending || !draft.trim()}>
            {sendPending ? "Versturen…" : "Verstuur antwoord"}
          </button>
        </div>
      </form>
    </div>
  );
}
