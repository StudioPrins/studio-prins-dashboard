"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";

export function WelcomeMail({
  subject,
  body,
}: {
  subject: string;
  body: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<"subject" | "body" | null>(null);

  async function copy(text: string, which: "subject" | "body") {
    await navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <>
      <button className="btn btn-secondary" onClick={() => setOpen(true)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Welkomstmail
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Welkomstmail" width={620}>
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">Onderwerp</label>
              <button
                className="text-xs font-medium text-accent"
                onClick={() => copy(subject, "subject")}
              >
                {copied === "subject" ? "Gekopieerd!" : "Kopieer"}
              </button>
            </div>
            <input readOnly value={subject} className="input" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">Bericht</label>
              <button
                className="text-xs font-medium text-accent"
                onClick={() => copy(body, "body")}
              >
                {copied === "body" ? "Gekopieerd!" : "Kopieer"}
              </button>
            </div>
            <textarea readOnly value={body} rows={14} className="input font-sans text-sm" />
          </div>
          <p className="text-xs text-muted">
            Kopieer de tekst en verstuur vanuit je eigen mailprogramma.
          </p>
        </div>
      </Modal>
    </>
  );
}
