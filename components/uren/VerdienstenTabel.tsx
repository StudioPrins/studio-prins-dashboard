"use client";

import { useMemo, useState } from "react";
import {
  berekenVerdiensten,
  formatMaand,
  formatUren,
  maandenMetUren,
  TARIEF_BEDRIJF_CENTS,
  TARIEF_KLANT_CENTS,
  type UurRegel,
} from "@/lib/uren";
import { formatCents } from "@/lib/format";

export function VerdienstenTabel({ rows }: { rows: UurRegel[] }) {
  const maanden = useMemo(() => maandenMetUren(rows), [rows]);
  const [maand, setMaand] = useState(""); // "" = aller tijden
  const rijen = useMemo(() => berekenVerdiensten(rows, maand || undefined), [rows, maand]);

  const totaal = rijen.reduce(
    (s, r) => ({
      klantMinuten: s.klantMinuten + r.klantMinuten,
      bedrijfMinuten: s.bedrijfMinuten + r.bedrijfMinuten,
      totaalMinuten: s.totaalMinuten + r.totaalMinuten,
      centen: s.centen + r.centen,
    }),
    { klantMinuten: 0, bedrijfMinuten: 0, totaalMinuten: 0, centen: 0 }
  );

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h2
            className="text-xl font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Verdiensten
          </h2>
          <p className="mt-1 text-sm text-muted">
            Klantwerk {formatCents(TARIEF_KLANT_CENTS)} per uur, bedrijfswerkzaamheden{" "}
            {formatCents(TARIEF_BEDRIJF_CENTS)} per uur.
          </p>
        </div>
        <select
          className="input w-auto"
          value={maand}
          onChange={(e) => setMaand(e.target.value)}
          aria-label="Periode"
        >
          <option value="">Aller tijden</option>
          {maanden.map((m) => (
            <option key={m} value={m}>
              {formatMaand(m)}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-line">
                <th className="font-medium px-5 py-3">Persoon</th>
                <th className="font-medium px-3 py-3 text-right">
                  Klantwerk
                  <span className="block text-xs font-normal">{formatCents(TARIEF_KLANT_CENTS)}/uur</span>
                </th>
                <th className="font-medium px-3 py-3 text-right">
                  Bedrijfswerk
                  <span className="block text-xs font-normal">{formatCents(TARIEF_BEDRIJF_CENTS)}/uur</span>
                </th>
                <th className="font-medium px-3 py-3 text-right">Totaal uren</th>
                <th className="font-medium px-5 py-3 text-right">Verdiend</th>
              </tr>
            </thead>
            <tbody>
              {rijen.map((r) => (
                <tr key={r.medewerker} className="border-b border-line">
                  <td className="px-5 py-3 font-medium">{r.naam}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-ink-soft">
                    {formatUren(r.klantMinuten)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-ink-soft">
                    {formatUren(r.bedrijfMinuten)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {formatUren(r.totaalMinuten)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums font-medium">
                    {formatCents(r.centen)}
                  </td>
                </tr>
              ))}
              <tr className="font-medium" style={{ borderTop: "1px solid var(--line-strong)" }}>
                <td className="px-5 py-3">Totaal</td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {formatUren(totaal.klantMinuten)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {formatUren(totaal.bedrijfMinuten)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {formatUren(totaal.totaalMinuten)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums">{formatCents(totaal.centen)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
