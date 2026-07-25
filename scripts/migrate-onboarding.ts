import { config } from "dotenv";
config({ path: [".env.local", ".env"] });
import { neon } from "@neondatabase/serverless";
import { CHECKLIST_TEMPLATE } from "../lib/checklist-template";

/**
 * Additieve migratie voor de customer-journey-uitbreiding.
 * Draaien met: npx tsx scripts/migrate-onboarding.ts
 *
 * Puur additief (ADD COLUMN / CREATE TABLE IF NOT EXISTS) zodat het veilig op
 * productie kan — de auto-classifier blokkeert `drizzle-kit push --force`.
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL ontbreekt (.env.local).");
  const sql = neon(url);

  console.log("Kolommen op clients toevoegen…");
  await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS postcode text`;
  await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS plaats text`;
  await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS kvk text`;
  await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS btw text`;
  await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS iban text`;
  await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_token text`;
  await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_sent_at timestamptz`;
  await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS intake_submitted_at timestamptz`;
  await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS drive_folder_id text`;
  await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS drive_folder_url text`;
  await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS intake jsonb`;

  console.log("Unieke index op onboarding_token…");
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS clients_onboarding_token_key ON clients (onboarding_token)`;

  console.log("Tabel checklist_template aanmaken…");
  await sql`
    CREATE TABLE IF NOT EXISTS checklist_template (
      id serial PRIMARY KEY,
      titel text NOT NULL,
      volgorde integer NOT NULL DEFAULT 0
    )
  `;

  const [{ count }] = (await sql`SELECT count(*)::int AS count FROM checklist_template`) as {
    count: number;
  }[];
  if (count === 0) {
    console.log("Hoofdsjabloon seeden vanuit CHECKLIST_TEMPLATE…");
    for (let i = 0; i < CHECKLIST_TEMPLATE.length; i++) {
      await sql`INSERT INTO checklist_template (titel, volgorde) VALUES (${CHECKLIST_TEMPLATE[i]}, ${i})`;
    }
  } else {
    console.log(`checklist_template bevat al ${count} rijen — niet opnieuw geseed.`);
  }

  console.log("Migratie klaar.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
