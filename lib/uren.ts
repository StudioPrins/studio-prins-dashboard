import type { UurRegistratie } from "@/lib/db/schema";
import { formatDate } from "@/lib/format";
import { DEMO } from "@/lib/demo";

/**
 * Team, tarieven en rekenwerk voor de urenregistratie.
 * Bewust puur (geen "server-only") zodat de client-componenten dit ook mogen
 * importeren — zelfde rol als lib/status.ts voor statussen.
 */

export type Medewerker = { key: string; naam: string; emails: string[] };

/**
 * Leest de teamsamenstelling uit NEXT_PUBLIC_TEAM.
 *
 * Vorm: `sleutel:Naam:adres,adres;sleutel:Naam:adres`
 * De adressen zijn optioneel en dienen alleen om de persoonskeuze voor te vullen
 * op basis van het ingelogde e-mailadres.
 *
 * LET OP: de sleutel is wat er in `uren.medewerker` staat. Wijzig je die, dan
 * raken bestaande registraties los van hun persoon. Namen en adressen mag je wel
 * aanpassen.
 *
 * Onleesbare onderdelen worden overgeslagen in plaats van de hele opgave te laten
 * mislukken: één typefout hoort niet de urenpagina onbruikbaar te maken.
 */
export function parseTeam(raw: string | undefined | null): Medewerker[] {
  if (!raw) return [];

  const leden: Medewerker[] = [];
  for (const stuk of raw.split(";")) {
    const [key, naam, adressen] = stuk.split(":").map((s) => s.trim());
    if (!key || !naam) continue;
    leden.push({
      key: key.toLowerCase(),
      naam,
      emails: (adressen ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    });
  }
  return leden;
}

/** Verzonnen team voor de publieke demo. */
const DEMO_TEAM: Medewerker[] = [
  { key: "sijmen", naam: "Sijmen", emails: ["sijmen@studioprins-demo.nl"] },
  { key: "sanne", naam: "Sanne", emails: ["sanne@studioprins-demo.nl"] },
  { key: "tim", naam: "Tim", emails: ["tim@studioprins-demo.nl"] },
];

/**
 * Zichtbaar onaf, zodat een vergeten NEXT_PUBLIC_TEAM meteen opvalt in plaats van
 * stilletjes de verkeerde mensen te tonen.
 */
const GEEN_TEAM: Medewerker[] = [{ key: "ik", naam: "Ik", emails: [] }];

/**
 * Wie er uren kan boeken.
 *
 * Komt uit configuratie en niet uit deze broncode: wie er bij Studio Prins werkt
 * en wat we rekenen zijn bedrijfsgegevens, en deze repo is openbaar.
 */
/**
 * Team uit een ruwe opgave, met terugval als er niets bruikbaars in staat.
 * Apart van TEAM zodat de terugval te testen is zonder de omgeving te vervalsen.
 */
export function teamUitConfig(raw: string | undefined | null): Medewerker[] {
  const leden = parseTeam(raw);
  return leden.length > 0 ? leden : GEEN_TEAM;
}

export const TEAM: Medewerker[] = DEMO
  ? DEMO_TEAM
  : teamUitConfig(process.env.NEXT_PUBLIC_TEAM);

export const TEAM_KEYS = TEAM.map((m) => m.key);

/** Weergavenaam bij een sleutel; onbekende sleutels tonen zichzelf. */
export function medewerkerNaam(key: string): string {
  return TEAM.find((m) => m.key === key)?.naam ?? key;
}

/** Voorinvulling van de persoonskeuze op basis van het ingelogde adres. */
export function medewerkerVoorEmail(email: string | null | undefined): string {
  if (!email) return "";
  const adres = email.trim().toLowerCase();
  return TEAM.find((m) => m.emails.includes(adres))?.key ?? "";
}

/** Bedrag in hele euro's (of met decimalen) → centen. Onleesbaar = 0. */
export function tariefUitEuro(raw: string | undefined | null): number {
  const n = Number((raw ?? "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : 0;
}

/**
 * Uurtarieven in centen, uit NEXT_PUBLIC_TARIEF_KLANT en _BEDRIJF (in euro's).
 * Staan ze niet ingesteld, dan is het tarief 0 — dat valt op de verdienstenpagina
 * meteen op, en dat is beter dan een verzonnen bedrag op een factuur zetten.
 */
export const TARIEF_KLANT_CENTS = DEMO ? 7500 : tariefUitEuro(process.env.NEXT_PUBLIC_TARIEF_KLANT);
export const TARIEF_BEDRIJF_CENTS = DEMO ? 5000 : tariefUitEuro(process.env.NEXT_PUBLIC_TARIEF_BEDRIJF);

export function tariefCents(soort: string): number {
  return soort === "bedrijf" ? TARIEF_BEDRIJF_CENTS : TARIEF_KLANT_CENTS;
}

/** Verdiend bedrag in hele centen voor een aantal minuten. */
export function verdiensteCents(minuten: number, soort: string): number {
  return Math.round((minuten / 60) * tariefCents(soort));
}

const urenFmt = new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 2 });

/** Minuten → "12,5 u" */
export function formatUren(minuten: number): string {
  return `${urenFmt.format((minuten ?? 0) / 60)} u`;
}

/**
 * Invoerveld → hele minuten. Accepteert "2", "2,5", "2.5", "1:30" en "90m".
 * Geeft null als er geen zinnig getal in staat.
 */
export function parseUren(invoer: string): number | null {
  const v = invoer.trim().toLowerCase().replace(/\s+/g, "");
  if (!v) return null;

  // "1:30" → 90 minuten
  const klok = v.match(/^(\d+):([0-5]?\d)$/);
  if (klok) return Number(klok[1]) * 60 + Number(klok[2]);

  // "90m" / "90min" → minuten
  const min = v.match(/^(\d+(?:[.,]\d+)?)m(?:in)?$/);
  if (min) {
    const n = Number(min[1].replace(",", "."));
    return Number.isFinite(n) ? Math.round(n) : null;
  }

  // "2", "2,5", "2.5", "2u", "2uur" → uren
  const uur = v.match(/^(\d+(?:[.,]\d+)?)(?:u(?:ur)?)?$/);
  if (uur) {
    const n = Number(uur[1].replace(",", "."));
    return Number.isFinite(n) ? Math.round(n * 60) : null;
  }

  return null;
}

/** Eén regel zoals de UI hem toont: de registratie + het factuurnummer erbij. */
export type UurRegel = UurRegistratie & { factuurNummer?: string | null };

/** Een urenregistratie in de vorm die het factuurformulier gebruikt. */
export type UurFactuurRegel = {
  uurId: number;
  /** "12 aug 2026 — Homepage ontwerp" */
  omschrijving: string;
  /** Uren met twee decimalen, past op numeric(10,2): "2.50" */
  aantal: string;
  prijsCents: number;
};

/**
 * Zet een geregistreerd uur om in een factuurregel: de omschrijving wordt de
 * titel (met de werkdatum ervoor), de gewerkte tijd het aantal, tegen het
 * klanttarief per uur. Blijft daarna een gewone, aanpasbare regel.
 */
export function uurNaarFactuurregel(r: UurRegistratie): UurFactuurRegel {
  const tekst = (r.omschrijving ?? "").trim();
  const datum = formatDate(r.datum);
  return {
    uurId: r.id,
    omschrijving: tekst ? `${datum} — ${tekst}` : datum,
    aantal: (r.minuten / 60).toFixed(2),
    prijsCents: TARIEF_KLANT_CENTS,
  };
}

export type UrenGroep = {
  /** Stabiele sleutel voor React en het uitklappen: "klant:12", "bedrijf", "verwijderd". */
  sleutel: string;
  naam: string;
  clientId: number | null;
  soort: string;
  /** Minuten per medewerker-sleutel. */
  totalen: Record<string, number>;
  totaalMinuten: number;
  regels: UurRegel[];
};

type KlantLabel = { id: number; bedrijf: string };

const leegTotaal = (): Record<string, number> =>
  Object.fromEntries(TEAM_KEYS.map((k) => [k, 0]));

/**
 * Bundelt registraties per klant. Alle meegegeven klanten komen terug (ook met
 * nul uren), plus Bedrijfswerkzaamheden en — als die er zijn — uren van
 * inmiddels verwijderde klanten.
 *
 * Volgorde: klanten met uren (meeste eerst), dan klanten zonder uren op naam,
 * dan Bedrijfswerkzaamheden, dan Verwijderde klanten.
 */
export function groepeerUren(
  rows: UurRegel[],
  klanten: KlantLabel[]
): UrenGroep[] {
  const maak = (sleutel: string, naam: string, clientId: number | null, soort: string): UrenGroep => ({
    sleutel,
    naam,
    clientId,
    soort,
    totalen: leegTotaal(),
    totaalMinuten: 0,
    regels: [],
  });

  const perKlant = new Map<number, UrenGroep>();
  for (const k of klanten) {
    perKlant.set(k.id, maak(`klant:${k.id}`, k.bedrijf, k.id, "klant"));
  }

  const bedrijf = maak("bedrijf", "Bedrijfswerkzaamheden", null, "bedrijf");
  const verwijderd = maak("verwijderd", "Verwijderde klanten", null, "klant");

  for (const r of rows) {
    let groep: UrenGroep;
    if (r.soort === "bedrijf") {
      groep = bedrijf;
    } else if (r.clientId != null) {
      groep = perKlant.get(r.clientId) ?? maak(`klant:${r.clientId}`, "Onbekende klant", r.clientId, "klant");
      perKlant.set(r.clientId, groep);
    } else {
      groep = verwijderd;
    }
    groep.regels.push(r);
    groep.totaalMinuten += r.minuten;
    groep.totalen[r.medewerker] = (groep.totalen[r.medewerker] ?? 0) + r.minuten;
  }

  const klantGroepen = [...perKlant.values()].sort((a, b) => {
    if (a.totaalMinuten !== b.totaalMinuten) return b.totaalMinuten - a.totaalMinuten;
    return a.naam.localeCompare(b.naam, "nl");
  });

  return [
    ...klantGroepen,
    bedrijf,
    ...(verwijderd.regels.length > 0 ? [verwijderd] : []),
  ];
}

export type VerdiensteRij = {
  medewerker: string;
  naam: string;
  klantMinuten: number;
  bedrijfMinuten: number;
  totaalMinuten: number;
  centen: number;
};

/** De maanden (YYYY-MM) waarin er uren geboekt zijn, nieuwste eerst. */
export function maandenMetUren(rows: UurRegel[]): string[] {
  const set = new Set(rows.map((r) => String(r.datum).slice(0, 7)));
  return [...set].sort().reverse();
}

/** YYYY-MM → "juli 2026" */
const maandFmt = new Intl.DateTimeFormat("nl-NL", { month: "long", year: "numeric" });
export function formatMaand(maand: string): string {
  const [jaar, mnd] = maand.split("-").map(Number);
  return maandFmt.format(new Date(jaar, mnd - 1, 1));
}

/**
 * Verdiensten per teamlid. Zonder `maand` telt alles mee, anders alleen de
 * registraties in die maand (YYYY-MM).
 */
export function berekenVerdiensten(rows: UurRegel[], maand?: string): VerdiensteRij[] {
  const relevant = maand ? rows.filter((r) => String(r.datum).startsWith(maand)) : rows;

  // Sleutels die wél in de data zitten maar niet in TEAM staan, krijgen alsnog
  // een rij. Zonder dat zouden hun uren stil uit het overzicht verdwijnen bij een
  // oud teamlid of een verkeerd ingestelde NEXT_PUBLIC_TEAM — en geld dat je niet
  // ziet is erger dan een rij met een onbekende naam erin. Zelfde afweging als de
  // groep "Verwijderde klanten" in groepeerUren().
  const onbekend = [...new Set(relevant.map((r) => r.medewerker))]
    .filter((k) => !TEAM.some((m) => m.key === k))
    .sort()
    .map((key) => ({ key, naam: medewerkerNaam(key), emails: [] }));

  return [...TEAM, ...onbekend].map(({ key, naam }) => {
    const eigen = relevant.filter((r) => r.medewerker === key);
    const klantMinuten = eigen
      .filter((r) => r.soort !== "bedrijf")
      .reduce((s, r) => s + r.minuten, 0);
    const bedrijfMinuten = eigen
      .filter((r) => r.soort === "bedrijf")
      .reduce((s, r) => s + r.minuten, 0);

    return {
      medewerker: key,
      naam,
      klantMinuten,
      bedrijfMinuten,
      totaalMinuten: klantMinuten + bedrijfMinuten,
      centen:
        verdiensteCents(klantMinuten, "klant") + verdiensteCents(bedrijfMinuten, "bedrijf"),
    };
  });
}
