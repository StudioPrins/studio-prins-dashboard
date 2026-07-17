import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { INVOICE_STATUSES } from "@/lib/status";
import { formatCents, formatDate } from "@/lib/format";
import type { InvoiceWithTotals } from "@/lib/queries";

export function InvoiceList({
  invoices,
  showClient = false,
}: {
  invoices: (InvoiceWithTotals & { clientName?: string | null })[];
  showClient?: boolean;
}) {
  if (invoices.length === 0) {
    return (
      <p className="text-sm text-muted py-6 text-center">
        Nog geen facturen of offertes.
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      {invoices.map((inv) => (
        <Link
          key={inv.id}
          href={`/facturen/${inv.id}`}
          className="flex items-center gap-4 py-3 px-1 border-b border-line last:border-0 hover:bg-surface-2/60 rounded-md transition-colors"
        >
          <span
            className="badge shrink-0"
            style={{
              background: inv.type === "offerte" ? "var(--surface-2)" : "var(--accent-soft)",
              color: inv.type === "offerte" ? "var(--ink-soft)" : "var(--accent-ink)",
            }}
          >
            {inv.type === "offerte" ? "Offerte" : "Factuur"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm font-mono">{inv.nummer}</p>
            <p className="text-xs text-muted truncate">
              {showClient ? inv.ontvangerBedrijf + " · " : ""}
              {formatDate(inv.datum)}
            </p>
          </div>
          <StatusBadge map={INVOICE_STATUSES} status={inv.status} />
          <span className="text-sm font-semibold tabular-nums w-24 text-right">
            {formatCents(inv.totals.totaalCents)}
          </span>
        </Link>
      ))}
    </div>
  );
}
