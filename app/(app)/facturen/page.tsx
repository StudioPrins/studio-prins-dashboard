import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { InvoiceList } from "@/components/invoices/InvoiceList";
import { getInvoices } from "@/lib/queries";
import { formatCents } from "@/lib/format";

export default async function FacturenPage() {
  const invoices = await getInvoices();

  const openstaand = invoices
    .filter((i) => i.type === "factuur" && ["verzonden", "verlopen"].includes(i.status))
    .reduce((s, i) => s + i.totals.totaalCents, 0);
  const betaald = invoices
    .filter((i) => i.type === "factuur" && i.status === "betaald")
    .reduce((s, i) => s + i.totals.totaalCents, 0);

  return (
    <div className="p-5 sm:p-8 max-w-[1100px] mx-auto">
      <PageHeader title="Facturen & offertes" subtitle={`${invoices.length} document${invoices.length === 1 ? "" : "en"}`}>
        <Link href="/facturen/nieuw" className="btn btn-primary">
          + Nieuwe factuur
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <p className="text-sm text-muted">Openstaand</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums" style={{ color: openstaand > 0 ? "var(--danger)" : "var(--ink)" }}>
            {formatCents(openstaand)}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-muted">Betaald (totaal)</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums" style={{ color: "var(--success)" }}>
            {formatCents(betaald)}
          </p>
        </div>
      </div>

      <div className="card p-5">
        <InvoiceList invoices={invoices} showClient />
      </div>
    </div>
  );
}
