# Studio Prins — Dashboard

Intern dashboard van Studio Prins: klanten met website-screenshots en onboarding-checklists, facturen & offertes met PDF, en een handmatige leadslijst met demo-URL's. Eén gebruiker, beveiligd met wachtwoord.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS v4** — eigen design-systeem in `app/globals.css`
- **Neon Postgres** + **Drizzle ORM** (`lib/db/`)
- **Auth**: één gebruiker via env-vars, `jose`-sessiecookie, bescherming in `proxy.ts`
- **PDF**: `@react-pdf/renderer` (`lib/pdf/`)

## Lokaal draaien

1. `npm install`
2. Maak een gratis **Neon**-database aan en kopieer de connectie-string.
3. Kopieer `.env.example` → `.env.local` en vul in (zie de opmerking over de `$`-escaping van de wachtwoord-hash).
4. `npm run db:push` — zet de tabellen klaar in de database.
5. (optioneel) `npm run db:seed` — voorbeelddata.
6. `npm run dev` — open http://localhost:3000

## Belangrijk om in te vullen

- `lib/bedrijf.ts` — KVK, btw-nummer, IBAN en adres (wettelijk verplicht op facturen).
- `lib/checklist-template.ts` — de standaard onboarding-stappen.

## Deploy (GitHub → Vercel)

1. Push naar GitHub (al gekoppeld).
2. Importeer de repo in Vercel.
3. Voeg via **Vercel Marketplace → Neon** een database toe (zet automatisch `DATABASE_URL`).
4. Zet alle env-vars in **Settings → Environment Variables** (zie tabel hieronder).
5. Na de eerste deploy: `npm run db:push` tegen de productie-`DATABASE_URL`.

> `.env.local` geldt **alleen lokaal** en staat in `.gitignore`; online wordt dat bestand
> nooit gelezen. Elke variabele moet dus apart in Vercel staan, en een nieuwe of gewijzigde
> variabele werkt pas ná een nieuwe deploy (Deployments → ⋯ → Redeploy).

| Variabele | Waarvoor | Zonder deze |
| --- | --- | --- |
| `AUTH_EMAILS` | Toegestane inlog-adressen (komma-gescheiden) | Niemand kan inloggen |
| `AUTH_PASSWORD_HASH` | bcrypt-hash — **rauw** op Vercel, `\$`-escaped in `.env.local` | Idem |
| `SESSION_SECRET` | Ondertekening sessiecookie | Idem |
| `DATABASE_URL` | Neon Postgres | Niets werkt |
| `RESEND_API_KEY`, `RESEND_FROM` | Onboardingmail via Resend | "E-mailverzending is nog niet ingesteld" |
| `APP_BASE_URL` | Basis-URL voor links in de mail (productie-URL, geen localhost) | Valt terug op de Vercel-productie-URL |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_DRIVE_PARENT_FOLDER_ID` | Drive-map per klant | Mail gaat zonder Drive-link |
| `ANTHROPIC_API_KEY` | Mailassistent (categoriseren + concepten) | Mailassistent faalt |
| `MAIL_SECRET` | Versleuteling IMAP/SMTP-wachtwoorden — moet **gelijk blijven** | Opgeslagen mailwachtwoorden onleesbaar |
| `CRON_SECRET` | Beveiliging van `/api/cron/mail-sync` | Cron-sync wordt geweigerd |

## Scripts

| Script | Doel |
| --- | --- |
| `npm run dev` | Ontwikkelserver |
| `npm run build` | Productiebuild |
| `npm run db:push` | Schema naar de database sturen |
| `npm run db:generate` | Migratiebestand genereren |
| `npm run db:seed` | Voorbeelddata |
| `npm run db:studio` | Drizzle Studio (database bekijken) |
