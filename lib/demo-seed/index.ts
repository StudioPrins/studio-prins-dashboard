import { db } from "../db";
import {
  clients,
  tasks,
  leads,
  invoices,
  invoiceLines,
  uren,
  mailAccounts,
  mailMessages,
  mailStyleExamples,
  companySettings,
  checklistTemplate,
  intakeFields,
} from "../db/schema";
import { CHECKLIST_TEMPLATE } from "../checklist-template";
import { STANDAARD_WEBSITE_VELDEN } from "../intake-fields";
import { uurNaarFactuurregel } from "../uren";
import { KLANTEN, LEADS, DEMO_BEDRIJF } from "./data";
import { UREN } from "./uren";
import { DEMO_ACCOUNT, DEMO_MAILS } from "./mail";

/* --- Datums ---------------------------------------------------------------- */

/** Datum n dagen geleden. */
function dagenGeleden(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/** Zelfde, maar als "JJJJ-MM-DD" voor de date-kolommen. Bewust lokale tijd: via
 *  toISOString() zou een datum vlak na middernacht een dag terugvallen. */
function datumString(n: number): string {
  const d = dagenGeleden(n);
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function urenGeleden(n: number): Date {
  return new Date(Date.now() - n * 60 * 60 * 1000);
}

/* --- Facturen en offertes -------------------------------------------------- */

type DemoDocument = {
  nummer: string;
  type: "factuur" | "offerte";
  /** Klant uit KLANTEN, of null voor een offerte aan een lead. */
  klant: string | null;
  /** Snapshot van de ontvanger als er geen klant aan hangt. */
  ontvanger?: { bedrijf: string; contact: string; email: string };
  status: "concept" | "verzonden" | "betaald" | "verlopen";
  dagenGeleden: number;
  /** Extra regels bovenop de regels die uit de uren komen. */
  extraRegels?: { omschrijving: string; aantal: string; prijsCents: number }[];
  notitie?: string;
};

const DOCUMENTEN: DemoDocument[] = [
  {
    nummer: "2026-001",
    type: "factuur",
    klant: "Bakkerij de Korenbloem",
    status: "betaald",
    dagenGeleden: 52,
    extraRegels: [{ omschrijving: "Onderhoudsabonnement, eerste maand", aantal: "1", prijsCents: 1900 }],
  },
  {
    nummer: "2026-002",
    type: "factuur",
    klant: "Fysiotherapie Maasoever",
    status: "betaald",
    dagenGeleden: 43,
    extraRegels: [{ omschrijving: "Onderhoudsabonnement, eerste maand", aantal: "1", prijsCents: 2900 }],
  },
  {
    nummer: "2026-003",
    type: "factuur",
    klant: "Restaurant De Zoutkeet",
    status: "betaald",
    dagenGeleden: 22,
  },
  {
    nummer: "2026-004",
    type: "factuur",
    klant: "Installatiebedrijf Warmte & Co",
    status: "verzonden",
    dagenGeleden: 15,
  },
  {
    nummer: "2026-005",
    type: "factuur",
    klant: "Atelier Nienke Bos",
    status: "verlopen",
    dagenGeleden: 34,
    notitie: "Herinnering gestuurd; klant gaf aan deze maand te betalen.",
  },
  {
    nummer: "2026-006",
    type: "factuur",
    klant: "Restaurant De Zoutkeet",
    status: "concept",
    dagenGeleden: 0,
    extraRegels: [{ omschrijving: "Onderhoudsabonnement, lopende maand", aantal: "1", prijsCents: 1900 }],
  },
  {
    nummer: "OFF-2026-001",
    type: "offerte",
    klant: null,
    ontvanger: {
      bedrijf: "Restaurant De Haven",
      contact: "Sofie Willems",
      email: "sofie@dehaven-demo.nl",
    },
    status: "verzonden",
    dagenGeleden: 28,
    extraRegels: [
      { omschrijving: "Ontwerp en bouw website (5 pagina's)", aantal: "1", prijsCents: 149500 },
      { omschrijving: "Zelf de menukaart kunnen aanpassen", aantal: "1", prijsCents: 39500 },
      { omschrijving: "Koppeling reserveringssysteem", aantal: "1", prijsCents: 24500 },
    ],
    notitie: "Geldig tot 30 dagen na dagtekening. Reserveringssysteem heeft een eigen maandbedrag.",
  },
  {
    nummer: "OFF-2026-002",
    type: "offerte",
    klant: null,
    ontvanger: {
      bedrijf: "Yogastudio Ademruimte",
      contact: "Lotte Prins",
      email: "lotte@ademruimte-demo.nl",
    },
    status: "verzonden",
    dagenGeleden: 13,
    extraRegels: [
      { omschrijving: "Ontwerp en bouw website", aantal: "1", prijsCents: 119500 },
      { omschrijving: "Lesrooster dat je zelf bijwerkt", aantal: "1", prijsCents: 34500 },
      { omschrijving: "Onderhoudsabonnement per maand", aantal: "1", prijsCents: 1900 },
    ],
    notitie: "Akkoord ontvangen; aanbetaling van 50% volgt.",
  },
];

/* --- Seeder ---------------------------------------------------------------- */

/**
 * Zet de demo-database terug naar de uitgangssituatie: alles leeg, daarna de
 * verzonnen inhoud erin. Herdraaibaar — dit is ook wat de nachtelijke reset doet.
 *
 * De datums zijn relatief aan vandaag, zodat de demo niet veroudert.
 */
export async function seedDemo(): Promise<{ klanten: number; uren: number; mails: number }> {
  // Leegmaken in FK-veilige volgorde. De cascades zouden het meeste al doen,
  // maar expliciet is hier duidelijker dan slim.
  await db.delete(invoiceLines);
  await db.delete(uren);
  await db.delete(invoices);
  await db.delete(tasks);
  await db.delete(clients);
  await db.delete(leads);
  await db.delete(mailMessages);
  await db.delete(mailStyleExamples);
  await db.delete(mailAccounts);
  await db.delete(companySettings);
  await db.delete(checklistTemplate);
  await db.delete(intakeFields);

  /* --- Instellingen --- */
  await db.insert(companySettings).values({ id: 1, ...DEMO_BEDRIJF });
  await db
    .insert(checklistTemplate)
    .values(CHECKLIST_TEMPLATE.map((titel, i) => ({ titel, volgorde: i })));
  await db.insert(intakeFields).values(
    STANDAARD_WEBSITE_VELDEN.map((v, i) => ({
      naam: v.naam,
      label: v.label,
      placeholder: v.placeholder,
      soort: v.soort,
      volgorde: i,
    }))
  );

  /* --- Klanten en checklists --- */
  const klantIdOpNaam = new Map<string, number>();

  for (const k of KLANTEN) {
    const [rij] = await db
      .insert(clients)
      .values({
        bedrijf: k.bedrijf,
        contactpersoon: k.contactpersoon,
        email: k.email,
        telefoon: k.telefoon ?? null,
        websiteUrl: k.websiteUrl ?? null,
        status: k.status,
        abonnementCents: k.abonnementCents,
        adres: k.adres ?? null,
        postcode: k.postcode ?? null,
        plaats: k.plaats ?? null,
        kvk: k.kvk ?? null,
        btw: k.btw ?? null,
        iban: k.iban ?? null,
        notities: k.notities ?? null,
        intake: k.intake ?? null,
        createdAt: dagenGeleden(k.klantSinds),
        // Een ingevulde intake betekent dat het formulier ook verstuurd is.
        onboardingToken:
          k.intake || k.onboardingVerstuurd ? `demo-${slug(k.bedrijf)}` : null,
        onboardingSentAt:
          k.intake ? dagenGeleden(60) : k.onboardingVerstuurd ? dagenGeleden(6) : null,
        intakeSubmittedAt: k.intake ? dagenGeleden(58) : null,
      })
      .returning({ id: clients.id });

    klantIdOpNaam.set(k.bedrijf, rij.id);

    await db.insert(tasks).values(
      CHECKLIST_TEMPLATE.map((titel, i) => ({
        clientId: rij.id,
        titel,
        done: i < k.afgevinkt,
        volgorde: i,
      }))
    );
  }

  /* --- Leads --- */
  await db.insert(leads).values(
    LEADS.map((l) => ({
      bedrijf: l.bedrijf,
      contactpersoon: l.contactpersoon,
      email: l.email,
      telefoon: l.telefoon ?? null,
      demoUrl: l.demoUrl ?? null,
      status: l.status,
      notities: l.notities ?? null,
    }))
  );

  /* --- Facturen en offertes (nog zonder regels) --- */
  const factuurIdOpNummer = new Map<string, number>();

  for (const d of DOCUMENTEN) {
    const klant = d.klant ? KLANTEN.find((k) => k.bedrijf === d.klant) : undefined;
    const clientId = d.klant ? klantIdOpNaam.get(d.klant) ?? null : null;
    const adres = klant?.adres
      ? `${klant.adres}, ${klant.postcode ?? ""} ${klant.plaats ?? ""}`.trim()
      : null;

    const [rij] = await db
      .insert(invoices)
      .values({
        type: d.type,
        nummer: d.nummer,
        clientId,
        // Snapshot: blijft staan ook als de klant later wijzigt of verdwijnt.
        ontvangerBedrijf: klant?.bedrijf ?? d.ontvanger?.bedrijf ?? "Onbekend",
        ontvangerContact: klant?.contactpersoon ?? d.ontvanger?.contact ?? null,
        ontvangerEmail: klant?.email ?? d.ontvanger?.email ?? null,
        ontvangerAdres: adres,
        datum: datumString(d.dagenGeleden),
        vervaldatum: datumString(d.dagenGeleden - 30),
        status: d.status,
        btwPercentage: 0, // KOR
        notitie: d.notitie ?? null,
      })
      .returning({ id: invoices.id });

    factuurIdOpNummer.set(d.nummer, rij.id);
  }

  /* --- Uren --- */
  const urenRijen = UREN.map(([klant, wie, dagen, minuten, omschrijving, factuur]) => ({
    clientId: klant ? klantIdOpNaam.get(klant) ?? null : null,
    // Werk zonder klant is bedrijfswerk; dat bepaalt het uurtarief (lib/uren.ts).
    soort: klant ? "klant" : "bedrijf",
    medewerker: wie,
    datum: datumString(dagen),
    minuten,
    omschrijving,
    invoiceId: factuur ? factuurIdOpNummer.get(factuur) ?? null : null,
  }));

  const bewaardeUren = await db.insert(uren).values(urenRijen).returning();

  /* --- Factuurregels ---
   * De regels van de gefactureerde documenten komen uit de uren zelf, via
   * dezelfde uurNaarFactuurregel() die de factuurbouwer gebruikt. Zo klopt de
   * demo met hoe het in productie werkt in plaats van het na te bootsen. */
  for (const d of DOCUMENTEN) {
    const invoiceId = factuurIdOpNummer.get(d.nummer);
    if (!invoiceId) continue;

    const uitUren = bewaardeUren
      .filter((u) => u.invoiceId === invoiceId)
      .sort((a, b) => a.datum.localeCompare(b.datum))
      .map((u) => uurNaarFactuurregel(u));

    const regels = [
      ...uitUren.map((r, i) => ({
        invoiceId,
        omschrijving: r.omschrijving,
        aantal: r.aantal,
        prijsCents: r.prijsCents,
        volgorde: i,
      })),
      ...(d.extraRegels ?? []).map((r, i) => ({
        invoiceId,
        omschrijving: r.omschrijving,
        aantal: r.aantal,
        prijsCents: r.prijsCents,
        volgorde: uitUren.length + i,
      })),
    ];

    if (regels.length > 0) await db.insert(invoiceLines).values(regels);
  }

  /* --- Mailbox --- */
  const [account] = await db
    .insert(mailAccounts)
    .values({
      naam: DEMO_ACCOUNT.naam,
      email: DEMO_ACCOUNT.email,
      imapHost: DEMO_ACCOUNT.imapHost,
      smtpHost: DEMO_ACCOUNT.smtpHost,
      username: DEMO_ACCOUNT.email,
      // Geen echt versleuteld wachtwoord: de demo heeft geen MAIL_SECRET en
      // opent nooit een verbinding. Een leesbare placeholder is hier eerlijker
      // dan iets dat op een sleutel lijkt.
      passwordEnc: "demo-geen-wachtwoord",
      sentFolder: DEMO_ACCOUNT.sentFolder,
      trashFolder: DEMO_ACCOUNT.trashFolder,
      lastSeenUid: 5025,
      lastSyncAt: urenGeleden(2),
      styleProfile: DEMO_ACCOUNT.styleProfile,
      styleImportedAt: dagenGeleden(9),
      active: true,
    })
    .returning({ id: mailAccounts.id });

  await db.insert(mailStyleExamples).values(
    DEMO_ACCOUNT.voorbeelden.map((v, i) => ({
      accountId: account.id,
      toAddress: v.toAddress,
      subject: v.subject,
      bodyText: v.bodyText,
      date: dagenGeleden(14 + i * 3),
    }))
  );

  await db.insert(mailMessages).values(
    DEMO_MAILS.map((m) => ({
      accountId: account.id,
      mailbox: "INBOX",
      uid: m.uid,
      messageId: `<demo-${m.uid}@studioprins-demo.nl>`,
      fromAddress: m.fromAddress,
      fromName: m.fromName,
      toAddress: DEMO_ACCOUNT.email,
      subject: m.subject,
      date: urenGeleden(m.urenGeleden),
      snippet: m.body.replace(/\s+/g, " ").trim().slice(0, 200),
      bodyText: m.body,
      bodyHtml: null,
      category: m.categorie,
      aiDraft: m.aiDraft ?? null,
      aiDraftGeneratedAt: m.aiDraft ? urenGeleden(Math.max(0, m.urenGeleden - 1)) : null,
      status: "nieuw",
    }))
  );

  return { klanten: KLANTEN.length, uren: urenRijen.length, mails: DEMO_MAILS.length };
}

/** Bedrijfsnaam → stabiele sleutel voor het onboarding-token. */
function slug(naam: string): string {
  return naam
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
