import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvoice, getCompanySettings } from "@/lib/queries";
import { InvoiceActions } from "@/components/invoices/InvoiceActions";
import { StatusBadge } from "@/components/StatusBadge";
import { INVOICE_STATUSES } from "@/lib/status";
import { formatCents, formatDate } from "@/lib/format";
import { lineTotalCents } from "@/lib/invoice-calc";
import { LOGO_DATA_URI } from "@/lib/pdf/logo";

export default async function FactuurDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inv = await getInvoice(Number(id));
  if (!inv) notFound();
  const bedrijf = await getCompanySettings();

  const titel = inv.type === "offerte" ? "Offerte" : "Factuur";

  return (
    <div className="p-5 sm:p-8 max-w-[820px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <Link href="/facturen" className="text-sm text-muted hover:text-ink">
          ← Facturen
        </Link>
        <div className="flex items-center gap-3">
          <StatusBadge map={INVOICE_STATUSES} status={inv.status} />
        </div>
      </div>

      <div className="mb-5">
        <InvoiceActions id={inv.id} type={inv.type} status={inv.status} />
      </div>

      {/* Preview van het document */}
      <div className="card p-8 sm:p-10">
        <div className="flex justify-between items-start gap-6 mb-10">
          <div>
            <p className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              {titel}
            </p>
            <p className="text-sm font-mono text-ink-soft">{inv.nummer}</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_DATA_URI} alt="Studio Prins" className="h-16 w-auto object-contain" />
        </div>

        <div className="grid grid-cols-2 gap-6 mb-10 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted mb-1">Van</p>
            <p className="font-medium">{bedrijf.naam}</p>
            {bedrijf.adres && <p className="text-ink-soft">{bedrijf.adres}</p>}
            {(bedrijf.postcode || bedrijf.plaats) && (
              <p className="text-ink-soft">{[bedrijf.postcode, bedrijf.plaats].filter(Boolean).join(" ")}</p>
            )}
            <p className="text-ink-soft">{bedrijf.email}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted mb-1">Aan</p>
            <p className="font-medium">{inv.ontvangerBedrijf}</p>
            {inv.ontvangerContact && <p className="text-ink-soft">{inv.ontvangerContact}</p>}
            {inv.ontvangerAdres && <p className="text-ink-soft">{inv.ontvangerAdres}</p>}
            {inv.ontvangerEmail && <p className="text-ink-soft">{inv.ontvangerEmail}</p>}
          </div>
        </div>

        <div className="flex gap-8 mb-8 text-sm">
          <div>
            <span className="text-muted">Datum: </span>
            <span className="font-medium">{formatDate(inv.datum)}</span>
          </div>
          {inv.vervaldatum && (
            <div>
              <span className="text-muted">Vervaldatum: </span>
              <span className="font-medium">{formatDate(inv.vervaldatum)}</span>
            </div>
          )}
        </div>

        {/* Regels */}
        <table className="w-full text-sm mb-8">
          <thead>
            <tr className="border-b border-line-strong text-left text-muted">
              <th className="py-2 font-medium">Omschrijving</th>
              <th className="py-2 font-medium text-right w-16">Aantal</th>
              <th className="py-2 font-medium text-right w-28">Prijs</th>
              <th className="py-2 font-medium text-right w-28">Totaal</th>
            </tr>
          </thead>
          <tbody>
            {inv.lines.map((l) => (
              <tr key={l.id} className="border-b border-line">
                <td className="py-2.5">{l.omschrijving}</td>
                <td className="py-2.5 text-right tabular-nums">{l.aantal}</td>
                <td className="py-2.5 text-right tabular-nums">{formatCents(l.prijsCents)}</td>
                <td className="py-2.5 text-right tabular-nums">
                  {formatCents(lineTotalCents(l.aantal, l.prijsCents))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-8">
          <dl className="w-64 flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotaal</dt>
              <dd className="tabular-nums">{formatCents(inv.totals.subtotaalCents)}</dd>
            </div>
            {inv.btwPercentage > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted">Btw ({inv.btwPercentage}%)</dt>
                <dd className="tabular-nums">{formatCents(inv.totals.btwCents)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-line-strong pt-2 mt-1 font-semibold text-base">
              <dt>Totaal</dt>
              <dd className="tabular-nums">{formatCents(inv.totals.totaalCents)}</dd>
            </div>
          </dl>
        </div>

        {inv.notitie && <p className="text-sm text-ink-soft mb-6">{inv.notitie}</p>}

        {inv.btwPercentage === 0 && bedrijf.kor && (
          <p className="text-sm italic text-muted mb-6">{bedrijf.korVermelding}</p>
        )}

        <div className="border-t border-line pt-5 text-xs text-muted flex flex-wrap gap-x-6 gap-y-1">
          {bedrijf.iban && <span>IBAN: {bedrijf.iban}</span>}
          {bedrijf.kvk && <span>KVK: {bedrijf.kvk}</span>}
          {bedrijf.btw && <span>Btw: {bedrijf.btw}</span>}
        </div>
        {(!bedrijf.iban || !bedrijf.kvk || !bedrijf.btw) && (
          <p className="mt-4 text-xs rounded-[10px] px-3 py-2" style={{ background: "var(--amber-soft)", color: "var(--amber)" }}>
            Tip: vul KVK, btw-nummer en IBAN in bij{" "}
            <Link href="/instellingen" className="underline font-medium">
              Bedrijfsgegevens
            </Link>{" "}
            — deze zijn wettelijk verplicht op een factuur.
          </p>
        )}
      </div>
    </div>
  );
}
