import { config } from "dotenv";
config({ path: [".env.local", ".env"] });
import { neon } from "@neondatabase/serverless";

/**
 * Additieve migratie voor het koppelen van urenregistraties aan facturen.
 * Draaien met: npx tsx scripts/migrate-uren-facturen.ts
 *
 * Puur additief (ADD COLUMN / INDEX IF NOT EXISTS) zodat het veilig op
 * productie kan — de auto-classifier blokkeert `drizzle-kit push --force`.
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL ontbreekt (.env.local).");
  const sql = neon(url);

  console.log("Kolom uren.invoice_id toevoegen…");
  await sql`
    ALTER TABLE uren
    ADD COLUMN IF NOT EXISTS invoice_id integer REFERENCES invoices(id) ON DELETE SET NULL
  `;

  console.log("Index op uren.invoice_id…");
  await sql`CREATE INDEX IF NOT EXISTS uren_invoice ON uren (invoice_id)`;

  console.log("Migratie klaar.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
