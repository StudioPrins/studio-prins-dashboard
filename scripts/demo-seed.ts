import { config } from "dotenv";
config({ path: [".env.local", ".env"] });
import { seedDemo } from "../lib/demo-seed";

/**
 * Vult de demo-database met verzonnen data.
 *
 * Dit script VERWIJDERT eerst alle rijen. Daarom eist het NEXT_PUBLIC_DEMO=1:
 * die staat alleen in de demo-omgeving, dus een .env.local die naar productie
 * wijst kan hier niet per ongeluk doorheen glippen.
 *
 * Draaien: npm run db:demo-seed
 */
async function main() {
  if (process.env.NEXT_PUBLIC_DEMO !== "1") {
    throw new Error(
      [
        "Geweigerd: NEXT_PUBLIC_DEMO staat niet op 1.",
        "Dit script wist alle rijen, dus het draait alleen tegen een demo-database.",
        "Zet NEXT_PUBLIC_DEMO=1 in de .env.local die naar je demo-database wijst.",
      ].join("\n")
    );
  }

  const url = process.env.DATABASE_URL ?? "";
  if (!url) throw new Error("DATABASE_URL ontbreekt.");

  console.log("Demo-seed tegen: " + url.replace(/:\/\/[^@]*@/, "://***@"));
  console.log("Alle bestaande rijen worden verwijderd.\n");

  const t = Date.now();
  const n = await seedDemo();
  console.log(
    `Klaar in ${((Date.now() - t) / 1000).toFixed(1)}s — ` +
      `${n.klanten} klanten, ${n.uren} uurregistraties, ${n.mails} mails.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
