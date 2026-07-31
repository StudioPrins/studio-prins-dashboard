import { config } from "dotenv";
config({ path: [".env.local", ".env"] });
import { neon } from "@neondatabase/serverless";

/**
 * Additieve migratie voor de urenregistratie (pagina /uren).
 * Draaien met: npx tsx scripts/migrate-uren.ts
 *
 * Puur additief (CREATE TABLE / INDEX IF NOT EXISTS) zodat het veilig op
 * productie kan — de auto-classifier blokkeert `drizzle-kit push --force`.
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL ontbreekt (.env.local).");
  const sql = neon(url);

  console.log("Tabel uren aanmaken…");
  await sql`
    CREATE TABLE IF NOT EXISTS uren (
      id serial PRIMARY KEY,
      client_id integer REFERENCES clients(id) ON DELETE SET NULL,
      soort text NOT NULL DEFAULT 'klant',
      medewerker text NOT NULL,
      datum date NOT NULL,
      minuten integer NOT NULL,
      omschrijving text,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  console.log("Indexen op uren…");
  await sql`CREATE INDEX IF NOT EXISTS uren_datum ON uren (datum)`;
  await sql`CREATE INDEX IF NOT EXISTS uren_client ON uren (client_id)`;

  console.log("Migratie klaar.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
