/**
 * Eenmalige, idempotente migratie voor het beheerbare intakeformulier.
 *
 * Maakt de tabel `intake_fields` aan en vult 'm met de standaardvragen als hij
 * nog leeg is. Net als bij de andere migratiescripts doen we dit met de
 * neon-client i.p.v. drizzle-kit: de live DB is gedrift t.o.v. de migratie-
 * journal, waardoor een gegenereerde migratie bestaande wijzigingen meeneemt.
 *
 * Draaien: npx tsx scripts/migrate-intake-fields.ts
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { STANDAARD_WEBSITE_VELDEN } from "../lib/intake-fields";

config({ path: [".env.local", ".env"] });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql.query(`CREATE TABLE IF NOT EXISTS "intake_fields" (
    "id" serial PRIMARY KEY NOT NULL,
    "naam" text NOT NULL,
    "label" text NOT NULL,
    "placeholder" text,
    "soort" text DEFAULT 'tekst' NOT NULL,
    "volgorde" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "intake_fields_naam_unique" UNIQUE("naam")
  )`);

  const [{ n }] = (await sql.query(
    `SELECT count(*)::int AS n FROM intake_fields`
  )) as { n: number }[];

  if (n > 0) {
    console.log(`intake_fields bestond al met ${n} vragen — niets gewijzigd.`);
    return;
  }

  for (const [i, v] of STANDAARD_WEBSITE_VELDEN.entries()) {
    await sql.query(
      `INSERT INTO intake_fields (naam, label, placeholder, soort, volgorde)
       VALUES ($1, $2, $3, $4, $5)`,
      [v.naam, v.label, v.placeholder, v.soort, i]
    );
  }
  console.log(`intake_fields aangemaakt en gevuld met ${STANDAARD_WEBSITE_VELDEN.length} vragen.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
