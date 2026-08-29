export type CalcLine = { aantal: string | number; prijsCents: number };

/** Regeltotaal in centen (aantal × prijs per stuk), afgerond op centen. */
export function lineTotalCents(aantal: string | number, prijsCents: number): number {
  const q = typeof aantal === "number" ? aantal : parseFloat(aantal || "0");
  return Math.round((Number.isFinite(q) ? q : 0) * prijsCents);
}

const aantalFmt = new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 2 });

/** numeric-string uit de database → "2,5" / "1" (zonder overbodige decimalen). */
export function formatAantal(aantal: string | number): string {
  const n = typeof aantal === "number" ? aantal : parseFloat(aantal || "0");
  return aantalFmt.format(Number.isFinite(n) ? n : 0);
}

export type InvoiceTotals = {
  subtotaalCents: number;
  btwCents: number;
  totaalCents: number;
};

/** Subtotaal, btw en totaal (in centen) voor een set regels. */
export function invoiceTotals(
  lines: CalcLine[],
  btwPercentage: number
): InvoiceTotals {
  const subtotaalCents = lines.reduce(
    (sum, l) => sum + lineTotalCents(l.aantal, l.prijsCents),
    0
  );
  const btwCents = Math.round((subtotaalCents * btwPercentage) / 100);
  return { subtotaalCents, btwCents, totaalCents: subtotaalCents + btwCents };
}
