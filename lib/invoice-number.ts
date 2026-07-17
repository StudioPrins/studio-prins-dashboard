import "server-only";
import { and, eq, like } from "drizzle-orm";
import { db } from "@/lib/db";
import { invoices } from "@/lib/db/schema";

/**
 * Volgend factuur-/offertenummer, per type een eigen jaarreeks.
 * Factuur → "2026-001", offerte → "OFF-2026-001".
 */
export async function nextInvoiceNumber(
  type: "factuur" | "offerte"
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = type === "offerte" ? `OFF-${year}-` : `${year}-`;

  const rows = await db
    .select({ nummer: invoices.nummer })
    .from(invoices)
    .where(and(eq(invoices.type, type), like(invoices.nummer, `${prefix}%`)));

  let max = 0;
  for (const r of rows) {
    const n = parseInt(r.nummer.slice(prefix.length), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }

  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}
