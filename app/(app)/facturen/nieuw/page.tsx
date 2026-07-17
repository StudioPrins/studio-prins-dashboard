import Link from "next/link";
import { getClientsForSelect } from "@/lib/queries";
import { InvoiceBuilder } from "@/components/invoices/InvoiceBuilder";

export default async function NieuweFactuurPage({
  searchParams,
}: {
  searchParams: Promise<{ klant?: string }>;
}) {
  const { klant } = await searchParams;
  const clients = await getClientsForSelect();
  const defaultClientId = klant ? Number(klant) : undefined;

  return (
    <div className="p-5 sm:p-8 max-w-[1400px] mx-auto">
      <Link href="/facturen" className="text-sm text-muted hover:text-ink inline-flex items-center gap-1 mb-5">
        ← Facturen
      </Link>
      <h1
        className="text-2xl sm:text-[28px] font-semibold tracking-tight mb-7"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Nieuwe factuur / offerte
      </h1>
      <InvoiceBuilder clients={clients} defaultClientId={defaultClientId} />
    </div>
  );
}
