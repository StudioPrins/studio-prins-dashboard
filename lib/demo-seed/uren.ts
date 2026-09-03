/**
 * Geregistreerde uren voor de demo. Compact als tuples zodat de lijst leesbaar
 * blijft: [klant, wie, dagen geleden, minuten, omschrijving, factuurnummer?].
 *
 * `klant` is null voor bedrijfswerkzaamheden (eigen site, administratie, acquisitie);
 * die tellen tegen het lagere tarief mee, zie lib/uren.ts.
 *
 * Het factuurnummer aan het eind betekent dat het uur al is afgeboekt. Regels
 * zónder factuurnummer zijn nog factureerbaar en vullen de factuurbouwer — dat is
 * bewust: wie de demo opent moet de flow van uren naar factuurregel kunnen lopen.
 */

export type UurSpec = [
  klant: string | null,
  wie: "sijmen" | "sanne" | "tim",
  dagenGeleden: number,
  minuten: number,
  omschrijving: string,
  factuur?: string,
];

const KORENBLOEM = "Bakkerij de Korenbloem";
const MAASOEVER = "Fysiotherapie Maasoever";
const WARMTE = "Installatiebedrijf Warmte & Co";
const ZOUTKEET = "Restaurant De Zoutkeet";
const ATELIER = "Atelier Nienke Bos";
const GROENRIJK = "Hoveniersbedrijf Groenrijk";
const VOORUIT = "Rijschool Vooruit";

export const UREN: UurSpec[] = [
  /* --- Bakkerij de Korenbloem: afgerond en gefactureerd op 2026-001 -------- */
  [KORENBLOEM, "sijmen", 72, 150, "Intakegesprek en wensen uitgewerkt", "2026-001"],
  [KORENBLOEM, "sijmen", 69, 240, "Wireframe home en assortiment", "2026-001"],
  [KORENBLOEM, "sanne", 66, 180, "Ontwerp uitgewerkt in Figma", "2026-001"],
  [KORENBLOEM, "sijmen", 63, 300, "Home en assortiment gebouwd", "2026-001"],
  [KORENBLOEM, "sijmen", 61, 210, "Bestelformulier taarten gebouwd", "2026-001"],
  [KORENBLOEM, "tim", 59, 120, "Teksten geredigeerd en ingevoerd", "2026-001"],
  [KORENBLOEM, "sijmen", 57, 90, "Feedbackronde verwerkt", "2026-001"],
  [KORENBLOEM, "sijmen", 55, 60, "Analytics en sitemap ingesteld", "2026-001"],
  [KORENBLOEM, "sijmen", 54, 75, "Live gezet en domein gekoppeld", "2026-001"],
  /* nog factureerbaar */
  [KORENBLOEM, "sijmen", 12, 45, "Openingstijden feestdagen aangepast"],
  [KORENBLOEM, "sanne", 6, 90, "Najaarsfoto's bijgesneden en geplaatst"],
  [KORENBLOEM, "sijmen", 2, 30, "Banner voor pompoenbroodjes"],

  /* --- Fysiotherapie Maasoever: gefactureerd op 2026-002 ------------------ */
  [MAASOEVER, "sijmen", 58, 120, "Intake en inventarisatie behandelingen", "2026-002"],
  [MAASOEVER, "sanne", 55, 270, "Ontwerp praktijk-site", "2026-002"],
  [MAASOEVER, "sijmen", 52, 360, "Site gebouwd, vijf pagina's", "2026-002"],
  [MAASOEVER, "sijmen", 50, 180, "Aanmeldformulier met mailkoppeling", "2026-002"],
  [MAASOEVER, "tim", 48, 150, "Vergoedingen per verzekeraar ingevoerd", "2026-002"],
  [MAASOEVER, "sijmen", 45, 120, "Feedback verwerkt en live gezet", "2026-002"],
  /* nog factureerbaar */
  [MAASOEVER, "sijmen", 9, 60, "Teamfoto's vervangen"],
  [MAASOEVER, "sijmen", 4, 75, "Tarievenpagina bijgewerkt voor nieuw jaar"],
  [MAASOEVER, "sijmen", 0, 90, "Aanmeldformulier op mobiel gefixt"],

  /* --- Restaurant De Zoutkeet: gefactureerd op 2026-003 ------------------- */
  [ZOUTKEET, "sijmen", 30, 120, "Winterkaart ingevoerd", "2026-003"],
  [ZOUTKEET, "sanne", 28, 90, "Foto's gerechten bewerkt", "2026-003"],
  [ZOUTKEET, "sijmen", 26, 60, "Openingstijden feestdagen", "2026-003"],
  [ZOUTKEET, "sijmen", 24, 45, "Reserveringslink bijgewerkt", "2026-003"],

  /* --- Warmte & Co: gefactureerd op 2026-004, plus open werk -------------- */
  [WARMTE, "sijmen", 21, 180, "Referentiepagina opgezet", "2026-004"],
  [WARMTE, "sanne", 20, 90, "Projectfoto's bijgesneden en uitgelijnd", "2026-004"],
  [WARMTE, "sijmen", 19, 60, "Contactformulier uitgebreid", "2026-004"],
  [WARMTE, "sijmen", 17, 45, "Teksten onderhoudscontracten", "2026-004"],
  /* nog factureerbaar */
  [WARMTE, "sijmen", 7, 120, "Pagina onderhoudscontracten gebouwd"],
  [WARMTE, "tim", 5, 60, "Teksten aangeleverd door klant verwerkt"],
  [WARMTE, "sijmen", 1, 45, "Formulier gekoppeld aan de mailbox"],

  /* --- Atelier Nienke Bos: gefactureerd op 2026-005 (verlopen) ------------ */
  [ATELIER, "sanne", 40, 240, "Portfolio-ontwerp", "2026-005"],
  [ATELIER, "sijmen", 38, 300, "Portfolio gebouwd met fotogalerij", "2026-005"],
  [ATELIER, "sijmen", 36, 90, "Contactpagina en formulier", "2026-005"],
  /* nog factureerbaar */
  [ATELIER, "sijmen", 8, 60, "Nieuwe stukken toegevoegd aan portfolio"],
  [ATELIER, "sijmen", 3, 45, "Voorbereiding gesprek webshop"],

  /* --- Lopende onboardings: nog niets gefactureerd ------------------------ */
  [GROENRIJK, "sijmen", 16, 90, "Intakegesprek gevoerd"],
  [GROENRIJK, "sijmen", 14, 60, "Drive-map ingericht en formulier verstuurd"],
  [GROENRIJK, "sanne", 10, 120, "Eerste schets huisstijl"],
  [GROENRIJK, "sijmen", 2, 75, "Projectfoto's van klant doorgenomen"],
  [VOORUIT, "sijmen", 11, 60, "Kennismakingsgesprek"],
  [VOORUIT, "sijmen", 5, 30, "Domeinnaam gecontroleerd op beschikbaarheid"],

  /* --- Acquisitie: telt als bedrijfswerk, niet als klantwerk -------------- */
  [null, "sijmen", 34, 180, "Demo gebouwd voor Restaurant De Haven"],
  [null, "sijmen", 31, 120, "Demo gebouwd voor Kapsalon Knip & Co"],
  [null, "sijmen", 23, 45, "Belrondje leads"],
  [null, "sijmen", 13, 90, "Offerte opgesteld voor Yogastudio Ademruimte"],

  /* --- Bedrijfswerkzaamheden --------------------------------------------- */
  [null, "sijmen", 70, 240, "Dashboard: urenregistratie gebouwd"],
  [null, "sijmen", 65, 180, "Dashboard: facturatie en PDF"],
  [null, "sijmen", 51, 300, "Dashboard: mailassistent met IMAP-sync"],
  [null, "sijmen", 47, 150, "Dashboard: categorisatie via Claude"],
  [null, "sijmen", 42, 120, "Dashboard: conceptantwoorden in eigen schrijfstijl"],
  [null, "sijmen", 33, 90, "Eigen website bijgewerkt"],
  [null, "tim", 29, 120, "Administratie derde kwartaal"],
  [null, "sijmen", 22, 60, "Boekhouder: bonnen aangeleverd"],
  [null, "sanne", 18, 90, "Portfolio bijgewerkt met nieuwe projecten"],
  [null, "sijmen", 15, 120, "Dashboard: uren automatisch als factuurregels"],
  [null, "sijmen", 10, 60, "Dashboard: mailsync ingepland via cron"],
  [null, "tim", 8, 90, "Offerteteksten herschreven"],
  [null, "sijmen", 6, 45, "Wekelijkse planning en mail bijwerken"],
  [null, "sanne", 4, 60, "Social media posts voorbereid"],
  [null, "sijmen", 1, 90, "Dashboard: demo-omgeving opgezet"],
];
