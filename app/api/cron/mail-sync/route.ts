import { runMailSync } from "@/lib/mail/sync";

// IMAP/SMTP zijn Node-libs; deze route mag niet op de edge draaien.
export const runtime = "nodejs";
// Ruime marge voor het ophalen + categoriseren van meerdere accounts.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * Periodieke mailsync, aangeroepen door Vercel Cron. Beveiligd met CRON_SECRET:
 * Vercel stuurt die automatisch mee als "Authorization: Bearer <CRON_SECRET>".
 *
 * Schema staat in vercel.json en is altijd UTC (Vercel kent geen tijdzone-optie):
 * 05:00 en 14:00 UTC = 07:00 en 16:00 hier in de zomer, een uur eerder in de winter.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const result = await runMailSync();
    return Response.json({ ok: true, ...result });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
