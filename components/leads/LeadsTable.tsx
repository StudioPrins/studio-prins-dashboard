"use client";

import { useTransition } from "react";
import { LeadFormModal } from "./LeadFormModal";
import { updateLeadStatus, deleteLead, convertLeadToClient } from "@/lib/actions/leads";
import { LEAD_STATUSES, LEAD_STATUS_KEYS, statusStyle } from "@/lib/status";
import { toHref } from "@/lib/screenshot";
import type { Lead } from "@/lib/db/schema";

export function LeadsTable({ leads }: { leads: Lead[] }) {
  if (leads.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-lg font-medium">Nog geen leads</p>
        <p className="mt-1 text-sm text-muted">
          Voeg handmatig een lead toe met de demo-URL die je hebt gegenereerd.
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Desktop-tabel */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted border-b border-line">
              <th className="font-medium px-5 py-3">Bedrijf</th>
              <th className="font-medium px-3 py-3">Contact</th>
              <th className="font-medium px-3 py-3">Demo</th>
              <th className="font-medium px-3 py-3">Status</th>
              <th className="font-medium px-5 py-3 text-right">Acties</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <LeadRow key={lead.id} lead={lead} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobiele kaarten */}
      <div className="md:hidden divide-y divide-line">
        {leads.map((lead) => (
          <LeadCardMobile key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
  const [pending, start] = useTransition();
  const demo = toHref(lead.demoUrl);
  return (
    <tr className="border-b border-line last:border-0" style={{ opacity: pending ? 0.55 : 1 }}>
      <td className="px-5 py-3">
        <p className="font-medium">{lead.bedrijf}</p>
        {lead.notities && <p className="text-xs text-muted truncate max-w-[220px]">{lead.notities}</p>}
      </td>
      <td className="px-3 py-3 text-ink-soft">
        {lead.contactpersoon && <p>{lead.contactpersoon}</p>}
        {lead.email && <p className="text-xs text-muted">{lead.email}</p>}
        {lead.telefoon && <p className="text-xs text-muted">{lead.telefoon}</p>}
        {!lead.contactpersoon && !lead.email && !lead.telefoon && <span className="text-muted">—</span>}
      </td>
      <td className="px-3 py-3">
        {demo ? (
          <a href={demo} target="_blank" rel="noreferrer" className="text-accent hover:underline">
            Bekijk demo ↗
          </a>
        ) : (
          <span className="text-muted">—</span>
        )}
      </td>
      <td className="px-3 py-3">
        <StatusSelect lead={lead} start={start} />
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center justify-end gap-1.5">
          <LeadFormModal mode="edit" lead={lead} triggerLabel="Bewerken" triggerClass="btn btn-ghost text-xs px-2 py-1.5" />
          <button
            className="btn btn-secondary text-xs px-2 py-1.5"
            disabled={pending}
            onClick={() => {
              if (confirm(`"${lead.bedrijf}" omzetten naar klant? De onboarding-checklist wordt gestart.`)) {
                start(() => convertLeadToClient(lead.id));
              }
            }}
          >
            → Klant
          </button>
          <button
            className="text-muted hover:text-danger px-1"
            aria-label="Verwijderen"
            disabled={pending}
            onClick={() => {
              if (confirm(`Lead "${lead.bedrijf}" verwijderen?`)) start(() => deleteLead(lead.id));
            }}
          >
            ×
          </button>
        </div>
      </td>
    </tr>
  );
}

function LeadCardMobile({ lead }: { lead: Lead }) {
  const [pending, start] = useTransition();
  const demo = toHref(lead.demoUrl);
  return (
    <div className="p-4" style={{ opacity: pending ? 0.55 : 1 }}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{lead.bedrijf}</p>
        <StatusSelect lead={lead} start={start} />
      </div>
      {lead.contactpersoon && <p className="text-sm text-ink-soft mt-0.5">{lead.contactpersoon}</p>}
      {demo && (
        <a href={demo} target="_blank" rel="noreferrer" className="text-sm text-accent inline-block mt-1">
          Bekijk demo ↗
        </a>
      )}
      <div className="flex gap-2 mt-3">
        <LeadFormModal mode="edit" lead={lead} triggerLabel="Bewerken" triggerClass="btn btn-secondary text-xs px-2.5 py-1.5" />
        <button
          className="btn btn-secondary text-xs px-2.5 py-1.5"
          disabled={pending}
          onClick={() => {
            if (confirm(`"${lead.bedrijf}" omzetten naar klant?`)) start(() => convertLeadToClient(lead.id));
          }}
        >
          → Klant
        </button>
        <button
          className="btn btn-danger text-xs px-2.5 py-1.5"
          disabled={pending}
          onClick={() => {
            if (confirm(`Lead "${lead.bedrijf}" verwijderen?`)) start(() => deleteLead(lead.id));
          }}
        >
          Verwijderen
        </button>
      </div>
    </div>
  );
}

function StatusSelect({
  lead,
  start,
}: {
  lead: Lead;
  start: (cb: () => void) => void;
}) {
  const st = statusStyle(LEAD_STATUSES, lead.status);
  return (
    <select
      value={lead.status}
      onChange={(e) => start(() => updateLeadStatus(lead.id, e.target.value))}
      className="badge"
      style={{ background: st.bg, color: st.fg, border: "none", cursor: "pointer", paddingRight: "1.5rem" }}
    >
      {LEAD_STATUS_KEYS.map((k) => (
        <option key={k} value={k} style={{ color: "var(--ink)", background: "#fff" }}>
          {LEAD_STATUSES[k].label}
        </option>
      ))}
    </select>
  );
}
