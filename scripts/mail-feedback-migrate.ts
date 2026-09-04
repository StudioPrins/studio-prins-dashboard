/**
 * Idempotente migratie voor de leerlus van de mailassistent.
 *
 * Tot nu toe deelden het concept en de verstuurde tekst één kolom (`ai_draft`):
 * bij verzenden werd het Claude-concept overschreven door wat er daadwerkelijk
 * uitging. Daarmee verdween precies het verschil waar de assistent van kan
 * leren. Deze migratie zet er een tweede kolom naast.
 *
 * Draaien: npx tsx scripts/mail-feedback-migrate.ts
 * (zie scripts/mail-migrate.ts voor waarom dit handmatig gaat en niet via
 * drizzle-kit push)
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: [".env.local", ".env"] });

const sql = neon(process.env.DATABASE_URL!);

const statements = [
  `ALTER TABLE "mail_messages" ADD COLUMN IF NOT EXISTS "sent_body" text`,
  `ALTER TABLE "mail_messages" ADD COLUMN IF NOT EXISTS "sent_at" timestamp with time zone`,
  `CREATE INDEX IF NOT EXISTS "mail_msg_account_sent_at" ON "mail_messages" USING btree ("account_id","sent_at")`,
];

/**
 * Van al beantwoorde mails weten we dat `ai_draft` de vérstuurde tekst bevat en
 * niet het concept — die is destijds overschreven. Die tekst verhuist dus naar
 * de nieuwe kolom en `ai_draft` gaat leeg: het concept is werkelijk weg, en zo
 * kan een oude rij straks niet als nep-correctiepaar de prompt in glippen.
 *
 * `sent_at` blijft bewust leeg. `created_at` is het synctijdstip, niet het
 * verzendtijdstip; dat zou een verzonnen waarde zijn.
 */
const backfill = `UPDATE "mail_messages"
     SET "sent_body" = "ai_draft", "ai_draft" = NULL
   WHERE "status" = 'beantwoord'
     AND "sent_body" IS NULL
     AND "ai_draft" IS NOT NULL
   RETURNING "id"`;

async function main() {
  for (const stmt of statements) {
    await sql.query(stmt);
  }
  const verplaatst = (await sql.query(backfill)) as { id: number }[];
  console.log(
    `Leerlus-kolommen aangemaakt (of bestonden al). ${verplaatst.length} eerdere ` +
      `antwoord(en) verplaatst naar sent_body.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
