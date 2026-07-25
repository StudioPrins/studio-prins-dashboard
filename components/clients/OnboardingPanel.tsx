"use client";

import { useState, useTransition } from "react";
import { sendOnboarding } from "@/lib/actions/onboarding";
import { formatDate } from "@/lib/format";

export function OnboardingPanel({
  clientId,
  hasEmail,
  email,
  sentAt,
  submittedAt,
  formUrl,
  driveUrl,
}: {
  clientId: number;
  hasEmail: boolean;
  email: string | null;
  sentAt: string | null;
  submittedAt: string | null;
  formUrl: string | null;
  driveUrl: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function send() {
    setError(null);
    startTransition(async () => {
      const res = await sendOnboarding(clientId);
      if (res.error) setError(res.error);
    });
  }

  async function copyForm() {
    if (!formUrl) return;
    await navigator.clipboard.writeText(formUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold tracking-tight">Onboarding</h2>
        {submittedAt ? (
          <span
            className="text-xs font-medium rounded-full px-2.5 py-1"
            style={{ background: "var(--success-soft, #e6f6ec)", color: "var(--success)" }}
          >
            Ingevuld
          </span>
        ) : sentAt ? (
          <span
            className="text-xs font-medium rounded-full px-2.5 py-1"
            style={{ background: "var(--surface-2)", color: "var(--ink-soft)" }}
          >
            Verstuurd
          </span>
        ) : (
          <span
            className="text-xs font-medium rounded-full px-2.5 py-1"
            style={{ background: "var(--surface-2)", color: "var(--muted)" }}
          >
            Nog niet gestart
          </span>
        )}
      </div>

      <div className="text-sm text-muted space-y-1 mb-4">
        <p>
          Onboardingmail{" "}
          {sentAt ? (
            <>verstuurd op <strong className="text-ink">{formatDate(sentAt)}</strong></>
          ) : (
            "nog niet verstuurd"
          )}
          {hasEmail ? (
            <> · naar <span className="text-ink">{email}</span></>
          ) : null}
        </p>
        {submittedAt && (
          <p>
            Intakeformulier ingevuld op{" "}
            <strong className="text-ink">{formatDate(submittedAt)}</strong>
          </p>
        )}
      </div>

      {!hasEmail && (
        <p
          className="text-sm rounded-[10px] px-3 py-2 mb-4"
          style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
        >
          Voeg eerst een e-mailadres toe (via Bewerken) om de onboardingmail te kunnen versturen.
        </p>
      )}

      {error && (
        <p
          className="text-sm rounded-[10px] px-3 py-2 mb-4"
          style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={send}
          disabled={pending || !hasEmail}
          className="btn btn-primary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {pending
            ? "Versturen…"
            : sentAt
              ? "Opnieuw versturen"
              : "Verstuur onboardingmail"}
        </button>

        {formUrl && (
          <>
            <a href={formUrl} target="_blank" rel="noreferrer" className="btn btn-secondary">
              Bekijk formulier
            </a>
            <button onClick={copyForm} className="btn btn-secondary">
              {copied ? "Gekopieerd!" : "Kopieer link"}
            </button>
          </>
        )}
        {driveUrl && (
          <a href={driveUrl} target="_blank" rel="noreferrer" className="btn btn-secondary">
            Drive-map
          </a>
        )}
      </div>
    </div>
  );
}
