"use client";

import { useState, useTransition } from "react";
import { AccountFormModal } from "./AccountFormModal";
import {
  testMailAccountAction,
  importSentMails,
  deleteMailAccount,
  type TestResult,
  type ImportResult,
} from "@/lib/actions/mail-accounts";
import type { MailAccountView } from "@/lib/db/schema";

export function AccountsList({ accounts }: { accounts: MailAccountView[] }) {
  if (accounts.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-lg font-medium">Nog geen mailaccounts</p>
        <p className="mt-1 text-sm text-muted">
          Koppel je eerste inbox om te beginnen met synchroniseren en beantwoorden.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {accounts.map((a) => (
        <AccountCard key={a.id} account={a} />
      ))}
    </div>
  );
}

function AccountCard({ account }: { account: MailAccountView }) {
  const [pending, start] = useTransition();
  const [test, setTest] = useState<TestResult | null>(null);
  const [imp, setImp] = useState<ImportResult | null>(null);

  const runTest = () =>
    start(async () => {
      setImp(null);
      setTest(await testMailAccountAction(account.id));
    });

  const runImport = () =>
    start(async () => {
      setTest(null);
      setImp(await importSentMails(account.id));
    });

  return (
    <div className="card p-4" style={{ opacity: pending ? 0.6 : 1 }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">
            {account.naam}{" "}
            <span className="text-muted font-normal">· {account.email}</span>
          </p>
          <p className="text-xs text-muted mt-0.5">
            IMAP {account.imapHost}:{account.imapPort} · SMTP {account.smtpHost}:
            {account.smtpPort}
          </p>
          <p className="text-xs text-muted mt-0.5">
            Verzonden-map: {account.sentFolder ?? "—"} · Prullenbak:{" "}
            {account.trashFolder ?? "—"}
          </p>
          <p className="text-xs text-muted mt-0.5">
            {account.styleImportedAt
              ? `Stijl geïmporteerd op ${new Date(account.styleImportedAt).toLocaleDateString("nl-NL")}`
              : "Stijl nog niet geïmporteerd"}
            {account.lastSyncAt
              ? ` · Laatste sync ${new Date(account.lastSyncAt).toLocaleString("nl-NL")}`
              : ""}
          </p>
          {account.lastError && (
            <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>
              Laatste fout: {account.lastError}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button className="btn btn-secondary text-xs px-2.5 py-1.5" disabled={pending} onClick={runTest}>
            Test verbinding
          </button>
          <button className="btn btn-secondary text-xs px-2.5 py-1.5" disabled={pending} onClick={runImport}>
            Importeer stijl
          </button>
          <AccountFormModal
            mode="edit"
            account={account}
            triggerLabel="Bewerken"
            triggerClass="btn btn-ghost text-xs px-2.5 py-1.5"
          />
          <button
            className="text-muted hover:text-danger px-1"
            aria-label="Verwijderen"
            disabled={pending}
            onClick={() => {
              if (confirm(`Account "${account.naam}" verwijderen? Alle gesynchroniseerde mails van dit account worden ook verwijderd.`)) {
                start(() => deleteMailAccount(account.id));
              }
            }}
          >
            ×
          </button>
        </div>
      </div>

      {test && (
        <div className="mt-3 rounded-[10px] px-3 py-2 text-sm" style={feedbackStyle(test.ok && test.smtpOk !== false)}>
          {test.ok ? (
            <>
              IMAP ✓ — Verzonden-map: {test.sentFolder ?? "niet gevonden"}, Prullenbak:{" "}
              {test.trashFolder ?? "niet gevonden"}.{" "}
              {test.smtpOk ? "SMTP ✓" : `SMTP ✗ (${test.smtpError ?? "onbekend"})`}
            </>
          ) : (
            <>IMAP ✗ — {test.error}</>
          )}
        </div>
      )}
      {imp && (
        <div className="mt-3 rounded-[10px] px-3 py-2 text-sm" style={feedbackStyle(imp.ok)}>
          {imp.ok
            ? `${imp.count} verzonden mails geïmporteerd en stijlprofiel bijgewerkt.`
            : imp.error}
        </div>
      )}
    </div>
  );
}

function feedbackStyle(ok: boolean) {
  return ok
    ? { background: "var(--success-soft)", color: "var(--success)" }
    : { background: "var(--danger-soft)", color: "var(--danger)" };
}
