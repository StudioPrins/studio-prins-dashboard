/**
 * Eenmalige, idempotente migratie voor de Mailassistent-tabellen.
 *
 * Deze repo werkt push-based (drizzle-kit push) en de live DB is gedrift t.o.v.
 * de migratiejournal, waardoor een gegenereerde migratie bestaande wijzigingen
 * mixt met nieuwe. Daarom maken we hier alleen de drie nieuwe mailtabellen aan
 * met IF NOT EXISTS, zodat dit veilig en herhaalbaar is.
 *
 * Draaien: npx tsx scripts/mail-migrate.ts
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: [".env.local", ".env"] });

const sql = neon(process.env.DATABASE_URL!);

const statements = [
  `CREATE TABLE IF NOT EXISTS "mail_accounts" (
    "id" serial PRIMARY KEY NOT NULL,
    "naam" text NOT NULL,
    "email" text NOT NULL,
    "imap_host" text NOT NULL,
    "imap_port" integer DEFAULT 993 NOT NULL,
    "smtp_host" text NOT NULL,
    "smtp_port" integer DEFAULT 465 NOT NULL,
    "smtp_secure" boolean DEFAULT true NOT NULL,
    "username" text NOT NULL,
    "password_enc" text NOT NULL,
    "sent_folder" text,
    "trash_folder" text,
    "last_seen_uid" integer,
    "uid_validity" text,
    "last_sync_at" timestamp with time zone,
    "last_error" text,
    "style_profile" text,
    "style_imported_at" timestamp with time zone,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "mail_accounts_email_unique" UNIQUE("email")
  )`,
  `CREATE TABLE IF NOT EXISTS "mail_messages" (
    "id" serial PRIMARY KEY NOT NULL,
    "account_id" integer NOT NULL,
    "mailbox" text DEFAULT 'INBOX' NOT NULL,
    "uid" integer NOT NULL,
    "message_id" text,
    "in_reply_to" text,
    "references" text,
    "from_address" text,
    "from_name" text,
    "to_address" text,
    "subject" text,
    "date" timestamp with time zone,
    "snippet" text,
    "body_text" text,
    "body_html" text,
    "category" text,
    "ai_draft" text,
    "ai_draft_generated_at" timestamp with time zone,
    "status" text DEFAULT 'nieuw' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "mail_style_examples" (
    "id" serial PRIMARY KEY NOT NULL,
    "account_id" integer NOT NULL,
    "to_address" text,
    "subject" text,
    "body_text" text NOT NULL,
    "date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `DO $$ BEGIN
    ALTER TABLE "mail_messages" ADD CONSTRAINT "mail_messages_account_id_mail_accounts_id_fk"
      FOREIGN KEY ("account_id") REFERENCES "public"."mail_accounts"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
    ALTER TABLE "mail_style_examples" ADD CONSTRAINT "mail_style_examples_account_id_mail_accounts_id_fk"
      FOREIGN KEY ("account_id") REFERENCES "public"."mail_accounts"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "mail_msg_account_mailbox_uid" ON "mail_messages" USING btree ("account_id","mailbox","uid")`,
  `CREATE INDEX IF NOT EXISTS "mail_msg_message_id" ON "mail_messages" USING btree ("message_id")`,
  `CREATE INDEX IF NOT EXISTS "mail_msg_status_category" ON "mail_messages" USING btree ("status","category")`,
];

async function main() {
  for (const stmt of statements) {
    await sql.query(stmt);
  }
  console.log("Mailassistent-tabellen aangemaakt (of bestonden al).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
