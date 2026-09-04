"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { CategoryBadge } from "./CategoryBadge";
import { DraftPanel } from "./DraftPanel";
import { DiffView } from "./DiffView";
import { deleteMessageAction, ignoreMessageAction } from "@/lib/actions/mail";
import type { MailRowView } from "@/lib/queries";

export function MailDetailModal({
  message,
  open,
  onClose,
}: {
  message: MailRowView;
  open: boolean;
  onClose: () => void;
}) {
  const [showHtml, setShowHtml] = useState(false);
  const [showReply, setShowReply] = useState(
    message.category === "belangrijk" || message.category === "beantwoorden"
  );
  const [pending, start] = useTransition();

  const beantwoord = message.status === "beantwoord";

  return (
    <Modal open={open} onClose={onClose} title={message.subject ?? "(geen onderwerp)"} width={760}>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <CategoryBadge category={message.category} />
        <span className="text-xs text-muted">
          {message.accountNaam} · {message.accountEmail}
        </span>
      </div>

      <div className="text-sm text-ink-soft mb-3">
        <p>
          <span className="text-muted">Van:</span>{" "}
          {message.fromName ? `${message.fromName} <${message.fromAddress}>` : message.fromAddress}
        </p>
        {message.date && (
          <p>
            <span className="text-muted">Datum:</span>{" "}
            {new Date(message.date).toLocaleString("nl-NL")}
          </p>
        )}
      </div>

      {/* Body */}
      <div className="rounded-[10px] border border-line bg-surface-2 p-3 max-h-[45vh] overflow-y-auto">
        {showHtml && message.bodyHtmlSafe ? (
          <iframe
            sandbox=""
            srcDoc={message.bodyHtmlSafe}
            className="w-full min-h-[300px] bg-white rounded"
            title="E-mail (opmaak)"
          />
        ) : (
          <pre className="whitespace-pre-wrap break-words text-sm font-sans">
            {message.bodyText || message.snippet || "(geen tekstinhoud)"}
          </pre>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        {message.bodyHtmlSafe && (
          <button
            className="btn btn-ghost text-xs px-2.5 py-1.5"
            onClick={() => setShowHtml((v) => !v)}
          >
            {showHtml ? "Toon platte tekst" : "Toon opmaak"}
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          {/* Negeren slaat nergens op bij een mail die al beantwoord is. */}
          {!beantwoord && (
            <button
              className="btn btn-secondary text-xs px-2.5 py-1.5"
              disabled={pending}
              onClick={() => start(async () => { await ignoreMessageAction(message.id); onClose(); })}
            >
              Negeren
            </button>
          )}
          <button
            className="btn btn-danger text-xs px-2.5 py-1.5"
            disabled={pending}
            onClick={() => start(async () => { await deleteMessageAction(message.id); onClose(); })}
          >
            Verwijderen
          </button>
        </div>
      </div>

      {beantwoord ? (
        <VerstuurdPanel message={message} />
      ) : showReply ? (
        <DraftPanel message={message} onSent={onClose} />
      ) : (
        <div className="mt-4 border-t border-line pt-4">
          <button className="btn btn-secondary text-sm" onClick={() => setShowReply(true)}>
            Beantwoorden
          </button>
        </div>
      )}
    </Modal>
  );
}

/**
 * Wat er bij een beantwoorde mail te zien is. Staat er een concept naast de
 * verstuurde tekst, dan tonen we het verschil; anders alleen wat er uitging.
 * Dat laatste geldt voor mails van vóór de leerlus en voor antwoorden die
 * helemaal zelf zijn getypt.
 */
function VerstuurdPanel({ message }: { message: MailRowView }) {
  if (message.sentBody && message.aiDraft) {
    return <DiffView concept={message.aiDraft} verstuurd={message.sentBody} />;
  }

  return (
    <div className="mt-4 border-t border-line pt-4">
      <h3 className="text-sm font-semibold mb-2">Jouw antwoord</h3>
      <div className="rounded-[10px] border border-line bg-surface-2 p-3 max-h-[40vh] overflow-y-auto">
        <p className="whitespace-pre-wrap break-words text-sm">
          {message.sentBody || "(niet bewaard)"}
        </p>
      </div>
      <p className="mt-2 text-xs text-muted">
        Zonder bewaard concept valt er geen verschil te tonen — dit antwoord is zelf getypt of
        dateert van vóór de leerlus.
      </p>
    </div>
  );
}
