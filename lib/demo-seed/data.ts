/**
 * Verzonnen inhoud voor de demo-omgeving. Bewust gescheiden van het wegschrijven
 * (lib/demo-seed/index.ts) zodat dit bestand alleen over de data gaat.
 *
 * Alles hier is fictief. De websites verwijzen naar neutrale tech-sites in plaats
 * van naar echte bakkers en hoveniers: het screenshot-paneel heeft een bestaande
 * URL nodig, en zo wordt er geen bestaand bedrijf onder een verzonnen naam getoond.
 */

export type DemoKlant = {
  bedrijf: string;
  contactpersoon: string;
  email: string;
  telefoon?: string;
  websiteUrl?: string;
  status: "onboarding" | "actief" | "onderhoud" | "gearchiveerd";
  abonnementCents: number;
  adres?: string;
  postcode?: string;
  plaats?: string;
  kvk?: string;
  btw?: string;
  iban?: string;
  notities?: string;
  /** Hoeveel stappen van de checklist zijn afgevinkt. */
  afgevinkt: number;
  /**
   * Hoeveel dagen geleden deze klant is aangemaakt. Het klantenoverzicht
   * sorteert op aanmaakdatum, dus zonder dit veld krijgen alle klanten in de
   * seed vrijwel hetzelfde tijdstip en bepaalt de invoegvolgorde het beeld.
   */
  klantSinds: number;
  /** Formulier verstuurd maar nog niet ingevuld. Bij een ingevulde `intake` is dit impliciet. */
  onboardingVerstuurd?: boolean;
  intake?: Record<string, string>;
};

export const KLANTEN: DemoKlant[] = [
  {
    bedrijf: "Bakkerij de Korenbloem",
    klantSinds: 150,
    contactpersoon: "Marijke de Vries",
    email: "marijke@korenbloem-demo.nl",
    telefoon: "010 123 45 67",
    websiteUrl: "nextjs.org",
    status: "actief",
    abonnementCents: 1900,
    adres: "Meent 12",
    postcode: "3011 JC",
    plaats: "Rotterdam",
    kvk: "12345678",
    btw: "NL123456789B01",
    iban: "NL00 DEMO 0123 4567 89",
    notities: "Wil elk seizoen nieuwe foto's op de site. Belt liever dan dat ze mailt.",
    afgevinkt: 11,
    intake: {
      domeinnaam: "korenbloem.nl",
      doel: "Meer bestellingen voor taarten op bestelling, en openingstijden op één plek die klopt.",
      doelgroep: "Buurtbewoners en bedrijven in het centrum die catering zoeken.",
      stijl: "Warm en ambachtelijk, veel foto's van het brood. Geen strak-zakelijk.",
      paginas: "Home, Assortiment, Taarten bestellen, Over ons, Contact",
      functies: "Bestelformulier voor taarten, openingstijden, route",
      socials: "Instagram",
      voorbeelden: "Sites waar je het brood bijna kunt ruiken: veel beeld, weinig tekst.",
      opmerkingen: "Rond de feestdagen wil ik zelf de banner kunnen aanpassen.",
    },
  },
  {
    bedrijf: "Fysiotherapie Maasoever",
    klantSinds: 120,
    contactpersoon: "Anouk Verlinden",
    email: "anouk@maasoever-demo.nl",
    telefoon: "010 234 56 78",
    websiteUrl: "tailwindcss.com",
    status: "actief",
    abonnementCents: 2900,
    adres: "Westzeedijk 210",
    postcode: "3016 AN",
    plaats: "Rotterdam",
    kvk: "23456789",
    btw: "NL234567890B01",
    iban: "NL00 DEMO 2345 6789 01",
    notities: "Praktijk met drie behandelkamers. Wil op termijn een online agenda.",
    afgevinkt: 11,
    intake: {
      domeinnaam: "fysiomaasoever.nl",
      doel: "Nieuwe patiënten laten zien wat we doen, en aanmelden makkelijker maken.",
      doelgroep: "Mensen met klachten uit de buurt, en verwijzers zoals huisartsen.",
      stijl: "Rustig en licht, veel wit. Vertrouwd maar niet klinisch.",
      paginas: "Home, Behandelingen, Team, Tarieven & vergoeding, Afspraak maken",
      functies: "Aanmeldformulier, vergoedingen per verzekeraar, route",
      socials: "LinkedIn",
      voorbeelden: "Sites van tandartspraktijken vind ik vaak te koud; het mag menselijker.",
      opmerkingen: "Moet vooral op een telefoon goed werken, veel mensen zoeken onderweg.",
    },
  },
  {
    bedrijf: "Installatiebedrijf Warmte & Co",
    klantSinds: 62,
    contactpersoon: "Ronald Kuipers",
    email: "ronald@warmte-en-co-demo.nl",
    telefoon: "010 345 67 89",
    websiteUrl: "react.dev",
    status: "actief",
    abonnementCents: 1900,
    adres: "Industrieweg 44",
    postcode: "3044 AS",
    plaats: "Rotterdam",
    kvk: "34567890",
    btw: "NL345678901B01",
    iban: "NL00 DEMO 3456 7890 12",
    notities: "Vraagt regelmatig kleine aanpassingen; die uren lopen los van het abonnement.",
    afgevinkt: 11,
  },
  {
    bedrijf: "Restaurant De Zoutkeet",
    klantSinds: 95,
    contactpersoon: "Youssef El Amrani",
    email: "youssef@zoutkeet-demo.nl",
    telefoon: "010 456 78 90",
    websiteUrl: "neon.tech",
    status: "onderhoud",
    abonnementCents: 1900,
    adres: "Zoutmanstraat 8",
    postcode: "3024 EN",
    plaats: "Rotterdam",
    kvk: "45678901",
    btw: "NL456789012B01",
    iban: "NL00 DEMO 4567 8901 23",
    notities: "Menukaart wisselt per seizoen, dus vier keer per jaar een update.",
    afgevinkt: 11,
  },
  {
    bedrijf: "Atelier Nienke Bos",
    klantSinds: 48,
    contactpersoon: "Nienke Bos",
    email: "nienke@atelierbos-demo.nl",
    telefoon: "06 12 34 56 78",
    websiteUrl: "resend.com",
    status: "actief",
    abonnementCents: 0,
    adres: "Voorhaven 31",
    postcode: "3024 RJ",
    plaats: "Rotterdam",
    kvk: "56789012",
    btw: "NL567890123B01",
    iban: "NL00 DEMO 5678 9012 34",
    notities: "Keramiek. Wil op termijn een kleine webshop, nu alleen portfolio.",
    afgevinkt: 9,
  },
  {
    bedrijf: "Hoveniersbedrijf Groenrijk",
    klantSinds: 21,
    contactpersoon: "Tom Bakker",
    email: "tom@groenrijk-demo.nl",
    telefoon: "010 567 89 01",
    status: "onboarding",
    abonnementCents: 0,
    plaats: "Capelle aan den IJssel",
    notities: "Intake gedaan, wacht nog op foto's van eerder werk.",
    afgevinkt: 4,
  },
  {
    bedrijf: "Rijschool Vooruit",
    klantSinds: 13,
    contactpersoon: "Deniz Yildirim",
    email: "deniz@rijschoolvooruit-demo.nl",
    telefoon: "06 23 45 67 89",
    status: "onboarding",
    abonnementCents: 0,
    plaats: "Schiedam",
    notities: "Intakeformulier verstuurd, nog niet ingevuld.",
    afgevinkt: 1,
    onboardingVerstuurd: true,
  },
  {
    bedrijf: "Boekhoudkantoor Steenbergen",
    klantSinds: 430,
    contactpersoon: "Peter Steenbergen",
    email: "peter@steenbergen-demo.nl",
    websiteUrl: "drizzle.team",
    status: "gearchiveerd",
    abonnementCents: 0,
    plaats: "Rotterdam",
    notities: "Site opgeleverd, daarna zelf overgenomen. Geen abonnement meer.",
    afgevinkt: 11,
  },
];

export type DemoLead = {
  bedrijf: string;
  contactpersoon: string;
  email: string;
  telefoon?: string;
  demoUrl?: string;
  status: "nieuw" | "demo-klaar" | "gemaild" | "gebeld" | "deal" | "afgewezen";
  notities?: string;
};

export const LEADS: DemoLead[] = [
  {
    bedrijf: "Restaurant De Haven",
    contactpersoon: "Sofie Willems",
    email: "sofie@dehaven-demo.nl",
    telefoon: "010 678 90 12",
    demoUrl: "de-haven-demo.vercel.app",
    status: "gemaild",
    notities: "Huidige site is jaren oud en niet mobiel. Demo verstuurd, nog geen reactie.",
  },
  {
    bedrijf: "Kapsalon Knip & Co",
    contactpersoon: "Ilona Ramdas",
    email: "ilona@knipenco-demo.nl",
    telefoon: "010 789 01 23",
    demoUrl: "knip-en-co-demo.vercel.app",
    status: "demo-klaar",
    notities: "Demo staat klaar, deze week bellen.",
  },
  {
    bedrijf: "Autobedrijf Van Dijk",
    contactpersoon: "Marco van Dijk",
    email: "marco@vandijk-auto-demo.nl",
    telefoon: "010 890 12 34",
    status: "gebeld",
    notities: "Wil eerst een offerte zien. Budget rond de 1.500.",
  },
  {
    bedrijf: "Yogastudio Ademruimte",
    contactpersoon: "Lotte Prins",
    email: "lotte@ademruimte-demo.nl",
    status: "deal",
    notities: "Akkoord op offerte OFF-2026-002. Klant aanmaken zodra de aanbetaling binnen is.",
  },
  {
    bedrijf: "Schildersbedrijf Van Loon",
    contactpersoon: "Ger van Loon",
    email: "ger@vanloon-demo.nl",
    status: "afgewezen",
    notities: "Een neef gaat het doen. Over een jaar nog eens proberen.",
  },
];

/**
 * Eigen bedrijfsgegevens in de demo. De demo laat het echte dashboard van Studio
 * Prins zien, dus de naam klopt — maar alles waar geld aan hangt (KVK, btw, IBAN)
 * is herkenbaar nep.
 */
export const DEMO_BEDRIJF = {
  naam: "Studio Prins",
  tagline: "Webdesign & digitale ervaringen",
  email: "hallo@studioprins-demo.nl",
  telefoon: "010 000 00 00",
  website: "studioprins.nl",
  adres: "Voorbeeldstraat 1",
  postcode: "3011 AB",
  plaats: "Rotterdam",
  kvk: "00000000",
  btw: "NL000000000B00",
  iban: "NL00 DEMO 0000 0000 00",
  tenaamstelling: "Studio Prins (demo)",
};
