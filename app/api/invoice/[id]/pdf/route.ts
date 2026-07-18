import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { getInvoice, getCompanySettings } from "@/lib/queries";
import { InvoicePdf } from "@/lib/pdf/InvoicePdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const invoice = await getInvoice(Number(id)); // bevat de sessie-check
  if (!invoice) return new Response("Niet gevonden", { status: 404 });
  const bedrijf = await getCompanySettings();

  const element = createElement(InvoicePdf, { invoice, bedrijf }) as ReactElement<DocumentProps>;
  const buffer = await renderToBuffer(element);
  const naam = `${invoice.type === "offerte" ? "offerte" : "factuur"}-${invoice.nummer}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${naam}"`,
    },
  });
}
