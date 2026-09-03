import { seedDemo } from "@/lib/demo-seed";
import { DEMO } from "@/lib/demo";

// Veel schrijfwerk tegen Postgres; niet op de edge.
export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * Zet de demo-omgeving 's nachts terug naar de uitgangssituatie, zodat bezoekers
 * vrij mogen rondklikken en aanpassen.
 *
 * Twee sloten, want deze route wist een hele database:
 * 1. Hij doet niets buiten de demo-omgeving — in productie is dit een 404.
 * 2. Daarbinnen nog steeds CRON_SECRET, net als de mailsync-route.
 */
export async function GET(request: Request) {
  if (!DEMO) {
    return new Response("Not found", { status: 404 });
  }

  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const n = await seedDemo();
    return Response.json({ ok: true, ...n });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
