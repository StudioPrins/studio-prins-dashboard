import type { UurRegistratie } from "@/lib/db/schema";
import { formatDate } from "@/lib/format";

/**
 * Team, tarieven en rekenwerk voor de urenregistratie.
 * Bewust puur (geen "server-only") zodat de client-componenten dit ook mogen
 * importeren — zelfde rol als lib/status.ts voor statussen.
 */

export type Medewerker = { key: string; naam: string; emails: string[] };

/** Wie er uren kan boeken. `emails` dient alleen om de keuze voor te vullen. */
export const TEAM: Medewerker[] = [
  { key: "sijmen", naam: "Sijmen", emails: ["sijmen@studioprins.nl", "info@studioprins.nl"] },
  { key: "lucas", naam: "Lucas", emails: ["lucas@studioprins.nl"] },
  { key: "levi", naam: "Levi", emails: ["levi@studioprins.nl"] },
];

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

/** Uurtarieven in centen. */
export const TARIEF_KLANT_CENTS = 6000;
export const TARIEF_BEDRIJF_CENTS = 4000;

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

  return TEAM.map(({ key, naam }) => {
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
