export type CalcLine = { aantal: string | number; prijsCents: number };

/** Regeltotaal in centen (aantal × prijs per stuk), afgerond op centen. */
export function lineTotalCents(aantal: string | number, prijsCents: number): number {
  const q = typeof aantal === "number" ? aantal : parseFloat(aantal || "0");
  return Math.round((Number.isFinite(q) ? q : 0) * prijsCents);
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
