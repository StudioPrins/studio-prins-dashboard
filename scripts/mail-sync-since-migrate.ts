/**
 * Eenmalige, idempotente migratie voor de sync-ondergrens van de Mailassistent.
 *
 * Voegt `sync_since` toe aan `mail_accounts` (default 2026-07-31 voor bestaande
 * accounts) en verwijdert alle reeds gesynchroniseerde mails van vóór die datum,
 * zodat het dashboard alleen nog echt-ongelezen mail toont.
 *
 * Draaien: npx tsx scripts/mail-sync-since-migrate.ts
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: [".env.local", ".env"] });

const sql = neon(process.env.DATABASE_URL!);

const SYNC_SINCE = "2026-07-31 00:00:00+02";

async function main() {
  await sql.query(
    `ALTER TABLE "mail_accounts" ADD COLUMN IF NOT EXISTS "sync_since" timestamp with time zone`
  );

  const updated = await sql.query(
    `UPDATE "mail_accounts" SET "sync_since" = $1 WHERE "sync_since" IS NULL RETURNING id`,
    [SYNC_SINCE]
  );
  console.log(`sync_since ingesteld op ${updated.length} account(s).`);

  const deleted = await sql.query(
    `DELETE FROM "mail_messages" WHERE "date" < $1 RETURNING id`,
    [SYNC_SINCE]
  );
  console.log(`${deleted.length} oude mail(s) verwijderd (date < ${SYNC_SINCE}).`);

  console.log("Migratie voltooid.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
