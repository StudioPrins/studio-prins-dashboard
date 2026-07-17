import "dotenv/config";
import { db } from "../lib/db";
import { clients, tasks, leads, invoices, invoiceLines } from "../lib/db/schema";
import { CHECKLIST_TEMPLATE } from "../lib/checklist-template";

/**
 * Vult de database met voorbeelddata om het dashboard te testen.
 * Draaien met: npm run db:seed
 */
async function main() {
  console.log("Seeden…");

  const [klant1] = await db
    .insert(clients)
    .values({
      bedrijf: "Bakkerij de Korenbloem",
      contactpersoon: "Marijke de Vries",
      email: "info@korenbloem.nl",
      telefoon: "010 123 45 67",
      websiteUrl: "vercel.com",
      status: "actief",
      abonnementCents: 1900,
      adres: "Meent 12, 3011 JC Rotterdam",
      notities: "Wil elk seizoen nieuwe foto's op de site.",
    })
    .returning({ id: clients.id });

  const [klant2] = await db
    .insert(clients)
    .values({
      bedrijf: "Hoveniersbedrijf Groenrijk",
      contactpersoon: "Tom Bakker",
      email: "tom@groenrijk.nl",
      websiteUrl: "nextjs.org",
      status: "onboarding",
      abonnementCents: 0,
    })
    .returning({ id: clients.id });

  for (const clientId of [klant1.id, klant2.id]) {
    await db.insert(tasks).values(
      CHECKLIST_TEMPLATE.map((titel, i) => ({
        clientId,
        titel,
        volgorde: i,
        done: clientId === klant1.id && i < 8, // klant1 grotendeels afgerond
      }))
    );
  }

  const [factuur] = await db
    .insert(invoices)
    .values({
      type: "factuur",
      nummer: "2026-001",
      clientId: klant1.id,
      ontvangerBedrijf: "Bakkerij de Korenbloem",
      ontvangerContact: "Marijke de Vries",
      ontvangerEmail: "info@korenbloem.nl",
      ontvangerAdres: "Meent 12, 3011 JC Rotterdam",
      datum: "2026-07-01",
      vervaldatum: "2026-07-15",
      status: "verzonden",
      btwPercentage: 21,
      notitie: "Bedankt voor de samenwerking!",
    })
    .returning({ id: invoices.id });

  await db.insert(invoiceLines).values([
    { invoiceId: factuur.id, omschrijving: "Website ontwerp & bouw", aantal: "1", prijsCents: 89500, volgorde: 0 },
    { invoiceId: factuur.id, omschrijving: "Onderhoud (eerste maand)", aantal: "1", prijsCents: 1900, volgorde: 1 },
  ]);

  await db.insert(leads).values([
    {
      bedrijf: "Restaurant De Haven",
      contactpersoon: "Sofie Willems",
      email: "info@dehaven.nl",
      demoUrl: "vercel.com",
      status: "demo-klaar",
      notities: "Gevonden via Google Maps, nog geen website.",
    },
    {
      bedrijf: "Installatiebedrijf Warmte & Co",
      telefoon: "06 22 33 44 55",
      status: "nieuw",
    },
  ]);

  console.log("Klaar! 2 klanten, 1 factuur, 2 leads toegevoegd.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
