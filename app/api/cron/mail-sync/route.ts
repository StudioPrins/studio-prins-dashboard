import { runMailSync } from "@/lib/mail/sync";
import { DEMO } from "@/lib/demo";
import { seedDemo } from "@/lib/demo-seed";

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

  // De demo-deploy draait dezelfde code en dus ook deze cron, maar heeft geen
  // mailkoppeling. In plaats van niets doen zetten we hier de demo-data terug.
  //
  // Waarom hier en niet met een eigen cron-regel: vercel.json is gedeeld tussen
  // het productie- en het demo-project, en op het Hobby-plan mag een project
  // maar twee cron jobs hebben. Die twee zijn al bezet, dus de reset lift mee.
  if (DEMO) {
    try {
      const n = await seedDemo();
      return Response.json({ ok: true, demoReset: n });
    } catch (err) {
      return Response.json(
        { ok: false, error: err instanceof Error ? err.message : String(err) },
        { status: 500 }
      );
    }
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
