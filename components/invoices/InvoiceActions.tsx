"use client";

import { useTransition } from "react";
import {
  updateInvoiceStatus,
  deleteInvoice,
  convertOfferteToFactuur,
} from "@/lib/actions/invoices";
import { INVOICE_STATUSES, INVOICE_STATUS_KEYS } from "@/lib/status";

export function InvoiceActions({
  id,
  type,
  status,
}: {
  id: number;
  type: string;
  status: string;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href={`/api/invoice/${id}/pdf`} className="btn btn-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        PDF downloaden
      </a>

      <select
        className="input"
        style={{ width: "auto", opacity: pending ? 0.6 : 1 }}
        value={status}
        onChange={(e) => start(() => updateInvoiceStatus(id, e.target.value))}
      >
        {INVOICE_STATUS_KEYS.map((k) => (
          <option key={k} value={k}>
            {INVOICE_STATUSES[k].label}
          </option>
        ))}
      </select>

      {type === "offerte" && (
        <button
          className="btn btn-secondary"
          disabled={pending}
          onClick={() => start(() => convertOfferteToFactuur(id))}
        >
          Omzetten naar factuur
        </button>
      )}

      <button
        className="btn btn-danger"
        disabled={pending}
        onClick={() => {
          if (confirm("Dit document definitief verwijderen?")) {
            start(() => deleteInvoice(id));
          }
        }}
      >
        Verwijderen
      </button>
    </div>
  );
}
