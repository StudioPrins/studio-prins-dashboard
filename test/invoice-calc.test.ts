import { describe, expect, it } from "vitest";
import { formatAantal, invoiceTotals, lineTotalCents } from "@/lib/invoice-calc";

/**
 * Het rekenwerk op een factuur. Alles in hele centen: zodra hier een halve cent
 * blijft rondslingeren klopt het bedrag op de PDF niet met het bedrag dat de
 * klant overmaakt.
 */

describe("lineTotalCents", () => {
  it("vermenigvuldigt aantal met de prijs per stuk", () => {
    expect(lineTotalCents(2, 6000)).toBe(12000);
    expect(lineTotalCents("2.50", 6000)).toBe(15000);
  });

  it("rondt af op hele centen", () => {
    // 0,33 uur × € 60 = € 19,80 → 1980 cent, niet 1979,999…
    expect(lineTotalCents("0.33", 6000)).toBe(1980);
    // 1,005 × 1 cent = 1,005 cent → 1 cent
    expect(lineTotalCents("1.005", 1)).toBe(1);
  });

  it("behandelt lege en onzinnige invoer als nul in plaats van NaN", () => {
    expect(lineTotalCents("", 6000)).toBe(0);
    expect(lineTotalCents("abc", 6000)).toBe(0);
    expect(lineTotalCents(Number.NaN, 6000)).toBe(0);
  });

  it("staat negatieve regels toe, voor een korting of creditregel", () => {
    expect(lineTotalCents(1, -2500)).toBe(-2500);
  });
});

describe("invoiceTotals", () => {
  const regels = [
    { aantal: "2.50", prijsCents: 6000 }, // 15000
    { aantal: "1", prijsCents: 1900 }, //  1900
  ];

  it("telt de regels op tot een subtotaal", () => {
    expect(invoiceTotals(regels, 0).subtotaalCents).toBe(16900);
  });

  it("rekent geen btw onder de KOR (0%)", () => {
    // Studio Prins valt onder de kleineondernemersregeling; dit is het
    // standaardgeval, niet de uitzondering.
    const t = invoiceTotals(regels, 0);
    expect(t.btwCents).toBe(0);
    expect(t.totaalCents).toBe(t.subtotaalCents);
  });

  it("rekent btw over het subtotaal, niet per regel", () => {
    const t = invoiceTotals(regels, 21);
    expect(t.btwCents).toBe(3549); // 16900 × 0,21 = 3549
    expect(t.totaalCents).toBe(20449);
  });

  it("rondt de btw af op hele centen", () => {
    // 1 cent × 21% = 0,21 cent → 0 cent
    expect(invoiceTotals([{ aantal: 1, prijsCents: 1 }], 21).btwCents).toBe(0);
    // 3 cent × 21% = 0,63 cent → 1 cent
    expect(invoiceTotals([{ aantal: 3, prijsCents: 1 }], 21).btwCents).toBe(1);
  });

  it("geeft nul terug voor een factuur zonder regels", () => {
    expect(invoiceTotals([], 21)).toEqual({
      subtotaalCents: 0,
      btwCents: 0,
      totaalCents: 0,
    });
  });
});

describe("formatAantal", () => {
  it("laat overbodige decimalen weg", () => {
    expect(formatAantal("1.00")).toBe("1");
    expect(formatAantal("2.50")).toBe("2,5");
    expect(formatAantal("2.25")).toBe("2,25");
  });

  it("valt terug op nul bij onbruikbare invoer", () => {
    expect(formatAantal("")).toBe("0");
    expect(formatAantal("abc")).toBe("0");
  });
});
