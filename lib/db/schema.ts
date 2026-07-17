import {
  pgTable,
  serial,
  integer,
  text,
  boolean,
  timestamp,
  numeric,
  date,
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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
  btwPercentage: integer("btw_percentage").notNull().default(21),
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

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InvoiceLine = typeof invoiceLines.$inferSelect;
export type Lead = typeof leads.$inferSelect;
