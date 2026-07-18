const euro = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
});

/** Centen → "€ 1.234,56" */
export function formatCents(cents: number): string {
  return euro.format((cents ?? 0) / 100);
}

/** Euro-string uit een invoerveld → hele centen (afgerond). */
export function euroToCents(value: string | number): number {
  if (typeof value === "number") return Math.round(value * 100);
  const normalized = value.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

const dateFmt = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** ISO-datum of Date → "5 jul 2026" */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return dateFmt.format(d);
}

/** ISO-datumstring (YYYY-MM-DD) van vandaag of een Date. */
export function toISODate(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Voegt dagen toe aan een datum en geeft ISO-datum terug. */
export function addDays(days: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/**
 * Voegt maanden toe en houdt dezelfde dag van de maand aan.
 * Valt de doeldag buiten de maand (bv. 31 → februari), dan de laatste dag.
 */
export function addMonths(months: number, from: Date = new Date()): string {
  const d = new Date(from);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return toISODate(d);
}
