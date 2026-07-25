"use client";

import { useState, useTransition } from "react";
import { syncNowAction } from "@/lib/actions/mail";

export function SyncButton() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const run = () =>
    start(async () => {
      setMsg(null);
      try {
        const res = await syncNowAction();
        const nieuw = res.perAccount.reduce((a, b) => a + b.nieuw, 0);
        const fouten = res.perAccount.filter((a) => a.fout).length;
        setMsg(
          `${nieuw} nieuw · ${res.gecategoriseerd} gecategoriseerd` +
            (fouten ? ` · ${fouten} account(s) met fout` : "")
        );
      } catch (err) {
        setMsg(err instanceof Error ? err.message : "Synchroniseren mislukt");
      }
    });

  return (
    <div className="flex items-center gap-2">
      {msg && <span className="text-xs text-muted">{msg}</span>}
      <button className="btn btn-primary" disabled={pending} onClick={run}>
        {pending ? "Synchroniseren…" : "Synchroniseer"}
      </button>
    </div>
  );
}
