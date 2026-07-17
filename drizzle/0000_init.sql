CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"bedrijf" text NOT NULL,
	"contactpersoon" text,
	"email" text,
	"telefoon" text,
	"website_url" text,
	"screenshot_override" text,
	"status" text DEFAULT 'onboarding' NOT NULL,
	"abonnement_cents" integer DEFAULT 0 NOT NULL,
	"adres" text,
	"notities" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"omschrijving" text NOT NULL,
	"aantal" numeric(10, 2) DEFAULT '1' NOT NULL,
	"prijs_cents" integer DEFAULT 0 NOT NULL,
	"volgorde" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text DEFAULT 'factuur' NOT NULL,
	"nummer" text NOT NULL,
	"client_id" integer,
	"ontvanger_bedrijf" text NOT NULL,
	"ontvanger_contact" text,
	"ontvanger_email" text,
	"ontvanger_adres" text,
	"datum" date NOT NULL,
	"vervaldatum" date,
	"status" text DEFAULT 'concept' NOT NULL,
	"btw_percentage" integer DEFAULT 21 NOT NULL,
	"notitie" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"bedrijf" text NOT NULL,
	"contactpersoon" text,
	"email" text,
	"telefoon" text,
	"demo_url" text,
	"status" text DEFAULT 'nieuw' NOT NULL,
	"notities" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"titel" text NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"volgorde" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;