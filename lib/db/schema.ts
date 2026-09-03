import {
  pgTable,
  serial,
  integer,
  text,
  boolean,
  timestamp,
  numeric,
  date,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/** Klanten van Studio Prins. Geldbedragen in hele centen. */
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  bedrijf: text("bedrijf").notNull(),
  contactpersoon: text("contactpersoon"),
  email: text("email"),
  telefoon: text("telefoon"),
  websiteUrl: text("website_url"),
  screenshotOverride: text("screenshot_override"),
  status: text("status").notNull().default("onboarding"), // onboarding | actief | onderhoud | gearchiveerd
  abonnementCents: integer("abonnement_cents").notNull().default(0), // €/maand
  adres: text("adres"),
  notities: text("notities"),

  // Facturatie-/bedrijfsgegevens van de klant (aangeleverd via het intakeformulier).
  postcode: text("postcode"),
  plaats: text("plaats"),
  kvk: text("kvk"),
  btw: text("btw"),
  iban: text("iban"),

  // Onboarding: geheime formulier-link, verzend-/invulmomenten en Drive-map.
  onboardingToken: text("onboarding_token").unique(),
  onboardingSentAt: timestamp("onboarding_sent_at", { withTimezone: true }),
  intakeSubmittedAt: timestamp("intake_submitted_at", { withTimezone: true }),
  driveFolderId: text("drive_folder_id"),
  driveFolderUrl: text("drive_folder_url"),
  // Vrije intake-antwoorden (websitewensen). Vorm: Record<string, string>.
  intake: jsonb("intake").$type<Record<string, string>>(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Beheerbaar hoofdsjabloon voor de onboarding-checklist. Bepaalt welke taken
 * een nieuwe klant automatisch krijgt. Te beheren via /instellingen.
 */
export const checklistTemplate = pgTable("checklist_template", {
  id: serial("id").primaryKey(),
  titel: text("titel").notNull(),
  volgorde: integer("volgorde").notNull().default(0),
});

/**
 * Beheerbare vragen van het intakeformulier (alleen de websitewensen — de
 * bedrijfsgegevens liggen vast omdat die naar echte kolommen op de klant
 * schrijven). Te beheren via /instellingen.
 *
 * `naam` is de sleutel waaronder het antwoord in `clients.intake` belandt en
 * wijzigt nooit na aanmaken; hernoemen raakt alleen `label`. Zo blijven eerder
 * gegeven antwoorden aan hun vraag gekoppeld.
 */
export const intakeFields = pgTable("intake_fields", {
  id: serial("id").primaryKey(),
  naam: text("naam").notNull().unique(),
  label: text("label").notNull(),
  placeholder: text("placeholder"),
  soort: text("soort").notNull().default("tekst"), // tekst | tekstvak
  volgorde: integer("volgorde").notNull().default(0),
});

/** Checklist-taken per klant (onboarding + lopend werk). */
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  titel: text("titel").notNull(),
  done: boolean("done").notNull().default(false),
  volgorde: integer("volgorde").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Facturen én offertes (onderscheiden via `type`). */
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("factuur"), // factuur | offerte
  nummer: text("nummer").notNull(), // bv. "2026-001"
  clientId: integer("client_id").references(() => clients.id, {
    onDelete: "set null",
  }),
  // Snapshot van de ontvanger op moment van opmaken (blijft stabiel op de PDF)
  ontvangerBedrijf: text("ontvanger_bedrijf").notNull(),
  ontvangerContact: text("ontvanger_contact"),
  ontvangerEmail: text("ontvanger_email"),
  ontvangerAdres: text("ontvanger_adres"),
  datum: date("datum").notNull(),
  vervaldatum: date("vervaldatum"),
  status: text("status").notNull().default("concept"), // concept | verzonden | betaald | verlopen
  btwPercentage: integer("btw_percentage").notNull().default(0),
  notitie: text("notitie"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Regels op een factuur/offerte. Prijs per stuk in centen (excl. btw). */
export const invoiceLines = pgTable("invoice_lines", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  omschrijving: text("omschrijving").notNull(),
  aantal: numeric("aantal", { precision: 10, scale: 2 }).notNull().default("1"),
  prijsCents: integer("prijs_cents").notNull().default(0),
  volgorde: integer("volgorde").notNull().default(0),
});

/** Handmatig toegevoegde leads met eigen gegenereerde demo-URL. */
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  bedrijf: text("bedrijf").notNull(),
  contactpersoon: text("contactpersoon"),
  email: text("email"),
  telefoon: text("telefoon"),
  demoUrl: text("demo_url"),
  status: text("status").notNull().default("nieuw"), // nieuw | demo-klaar | gemaild | gebeld | deal | afgewezen
  notities: text("notities"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Eigen bedrijfsgegevens van Studio Prins (één rij, id=1). Voor op de facturen. */
export const companySettings = pgTable("company_settings", {
  id: integer("id").primaryKey().default(1),
  naam: text("naam"),
  tagline: text("tagline"),
  email: text("email"),
  telefoon: text("telefoon"),
  website: text("website"),
  adres: text("adres"),
  postcode: text("postcode"),
  plaats: text("plaats"),
  kvk: text("kvk"),
  btw: text("btw"),
  iban: text("iban"),
  tenaamstelling: text("tenaamstelling"),
});

export type CompanySettings = typeof companySettings.$inferSelect;

/**
 * Gekoppelde IMAP/SMTP-mailboxen. Het wachtwoord staat AES-256-GCM-versleuteld
 * in `passwordEnc` (formaat "v1:<iv>:<tag>:<ct>", zie lib/mail/crypto.ts) en
 * gaat nooit terug naar de client.
 */
export const mailAccounts = pgTable("mail_accounts", {
  id: serial("id").primaryKey(),
  naam: text("naam").notNull(), // label, bv. "Studio Prins info"
  email: text("email").notNull().unique(), // afzenderadres
  imapHost: text("imap_host").notNull(),
  imapPort: integer("imap_port").notNull().default(993),
  smtpHost: text("smtp_host").notNull(),
  smtpPort: integer("smtp_port").notNull().default(465),
  smtpSecure: boolean("smtp_secure").notNull().default(true),
  username: text("username").notNull(), // vaak gelijk aan email
  passwordEnc: text("password_enc").notNull(),
  // Map-detectie (cache; handmatig overschrijfbaar in de instellingen)
  sentFolder: text("sent_folder"),
  trashFolder: text("trash_folder"),
  // Sync-state
  lastSeenUid: integer("last_seen_uid"), // hoogste verwerkte INBOX-UID
  uidValidity: text("uid_validity"), // bigint als text; bij wijziging: reset
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  lastError: text("last_error"),
  /** Ondergrens voor sync: mails van vóór deze datum worden nooit opgehaald. null = geen grens. */
  syncSince: timestamp("sync_since", { withTimezone: true }),
  // Schrijfstijl
  styleProfile: text("style_profile"), // door Claude gedistilleerde stijlsamenvatting
  styleImportedAt: timestamp("style_imported_at", { withTimezone: true }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Gesynchroniseerde inkomende mails per account. */
export const mailMessages = pgTable(
  "mail_messages",
  {
    id: serial("id").primaryKey(),
    accountId: integer("account_id")
      .notNull()
      .references(() => mailAccounts.id, { onDelete: "cascade" }),
    mailbox: text("mailbox").notNull().default("INBOX"),
    uid: integer("uid").notNull(),
    messageId: text("message_id"), // Message-ID header (threading + dedupe)
    inReplyTo: text("in_reply_to"),
    references: text("references"), // volledige References-header
    fromAddress: text("from_address"),
    fromName: text("from_name"),
    toAddress: text("to_address"),
    subject: text("subject"),
    date: timestamp("date", { withTimezone: true }),
    snippet: text("snippet"), // eerste ~200 tekens platte tekst
    bodyText: text("body_text"), // afgekapt op ~50.000 tekens
    bodyHtml: text("body_html"), // ruwe HTML; sanitizen bij render
    // belangrijk | beantwoorden | nieuwsbrief | notificatie | onbelangrijk (null = nog niet gecategoriseerd)
    category: text("category"),
    aiDraft: text("ai_draft"),
    aiDraftGeneratedAt: timestamp("ai_draft_generated_at", { withTimezone: true }),
    // nieuw | beantwoord | verwijderd | genegeerd
    status: text("status").notNull().default("nieuw"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("mail_msg_account_mailbox_uid").on(t.accountId, t.mailbox, t.uid),
    index("mail_msg_message_id").on(t.messageId),
    index("mail_msg_status_category").on(t.status, t.category),
  ]
);

/** Voorbeelden uit de Verzonden-map per account, voor stijlleren. */
export const mailStyleExamples = pgTable("mail_style_examples", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => mailAccounts.id, { onDelete: "cascade" }),
  toAddress: text("to_address"),
  subject: text("subject"),
  bodyText: text("body_text").notNull(), // afgekapt op ~4.000 tekens
  date: timestamp("date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Gewerkte uren per teamlid, geboekt op een klant of op bedrijfswerkzaamheden.
 * De duur staat in hele minuten, zodat optellen exact blijft.
 *
 * `soort` bepaalt het uurtarief (zie lib/uren.ts) en staat bewust náást
 * `clientId`: wordt een klant verwijderd, dan blijft de registratie bestaan met
 * `client_id = null` en telt hij nog steeds als klantwerk mee in de verdiensten.
 */
export const uren = pgTable(
  "uren",
  {
    id: serial("id").primaryKey(),
    clientId: integer("client_id").references(() => clients.id, {
      onDelete: "set null",
    }),
    soort: text("soort").notNull().default("klant"), // klant | bedrijf
    medewerker: text("medewerker").notNull(), // sleutel uit NEXT_PUBLIC_TEAM, zie lib/uren.ts
    datum: date("datum").notNull(),
    minuten: integer("minuten").notNull(),
    omschrijving: text("omschrijving"),
    /**
     * De factuur waarop dit uur verwerkt is; null = nog factureerbaar.
     * `set null` geeft de uren vanzelf weer vrij als de factuur verdwijnt.
     */
    invoiceId: integer("invoice_id").references(() => invoices.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("uren_datum").on(t.datum),
    index("uren_client").on(t.clientId),
    index("uren_invoice").on(t.invoiceId),
  ]
);

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type ChecklistTemplateItem = typeof checklistTemplate.$inferSelect;
export type IntakeFieldRow = typeof intakeFields.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InvoiceLine = typeof invoiceLines.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type MailAccount = typeof mailAccounts.$inferSelect;
export type NewMailAccount = typeof mailAccounts.$inferInsert;
export type MailMessage = typeof mailMessages.$inferSelect;
export type MailStyleExample = typeof mailStyleExamples.$inferSelect;
export type UurRegistratie = typeof uren.$inferSelect;

/** Account zonder het versleutelde wachtwoord — veilig om naar de client te sturen. */
export type MailAccountView = Omit<MailAccount, "passwordEnc">;
