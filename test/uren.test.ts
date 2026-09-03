import { describe, expect, it } from "vitest";
import type { UurRegistratie } from "@/lib/db/schema";
import {
  TARIEF_BEDRIJF_CENTS,
  TARIEF_KLANT_CENTS,
  TEAM,
  berekenVerdiensten,
  groepeerUren,
  maandenMetUren,
  parseTeam,
  parseUren,
  teamUitConfig,
  tariefUitEuro,
  uurNaarFactuurregel,
  verdiensteCents,
} from "@/lib/uren";

/** Bouwt een urenregistratie met alleen de velden die de test nodig heeft. */
function uur(over: Partial<UurRegistratie> = {}): UurRegistratie {
  return {
    id: 1,
    clientId: 1,
    soort: "klant",
    medewerker: "sijmen",
    datum: "2026-08-12",
    minuten: 60,
    omschrijving: "Werk",
    invoiceId: null,
    createdAt: new Date("2026-08-12T10:00:00Z"),
    ...over,
  };
}

describe("parseTeam", () => {
  it("leest sleutel, naam en adressen", () => {
    expect(parseTeam("sijmen:Sijmen:sijmen@x.nl,info@x.nl;tess:Tess:tess@x.nl")).toEqual([
      { key: "sijmen", naam: "Sijmen", emails: ["sijmen@x.nl", "info@x.nl"] },
      { key: "tess", naam: "Tess", emails: ["tess@x.nl"] },
    ]);
  });

  it("staat een teamlid zonder adressen toe", () => {
    expect(parseTeam("tess:Tess")).toEqual([{ key: "tess", naam: "Tess", emails: [] }]);
    expect(parseTeam("tess:Tess:")).toEqual([{ key: "tess", naam: "Tess", emails: [] }]);
  });

  it("negeert spaties rond de onderdelen", () => {
    expect(parseTeam("  tess : Tess : Tess@X.nl , info@x.nl ")).toEqual([
      { key: "tess", naam: "Tess", emails: ["tess@x.nl", "info@x.nl"] },
    ]);
  });

  it("normaliseert sleutel en adressen naar kleine letters, maar laat de naam staan", () => {
    const [m] = parseTeam("TESS:Tess de Wit:TESS@X.NL");
    expect(m.key).toBe("tess");
    expect(m.naam).toBe("Tess de Wit");
    expect(m.emails).toEqual(["tess@x.nl"]);
  });

  it("slaat onleesbare onderdelen over in plaats van alles te laten mislukken", () => {
    // Eén typefout hoort niet de hele urenpagina onbruikbaar te maken.
    expect(parseTeam("tess:Tess:tess@x.nl;;rommel;:GeenSleutel:x@x.nl;bram:Bram")).toEqual([
      { key: "tess", naam: "Tess", emails: ["tess@x.nl"] },
      { key: "bram", naam: "Bram", emails: [] },
    ]);
  });

  it("geeft een lege lijst bij ontbrekende of lege configuratie", () => {
    expect(parseTeam(undefined)).toEqual([]);
    expect(parseTeam(null)).toEqual([]);
    expect(parseTeam("")).toEqual([]);
  });
});

describe("teamUitConfig", () => {
  it("gebruikt de opgave als die bruikbaar is", () => {
    expect(teamUitConfig("tess:Tess").map((m) => m.key)).toEqual(["tess"]);
  });

  it("valt terug op één persoon als er niets bruikbaars in staat", () => {
    // Een lege array is truthy in JavaScript. Zonder expliciete lengtecheck zou
    // een ontbrekende NEXT_PUBLIC_TEAM een leeg team opleveren en kon niemand
    // nog uren boeken — precies die fout maakte ik hier eerst.
    for (const leeg of [undefined, null, "", "rommel", ";;;"]) {
      expect(teamUitConfig(leeg).length).toBeGreaterThan(0);
    }
  });
});

describe("TEAM", () => {
  it("komt uit de configuratie", () => {
    expect(TEAM.map((m) => m.key)).toEqual(["sijmen", "sam"]);
  });

  it("bevat altijd minstens één persoon", () => {
    // Een lege array is truthy in JavaScript; zonder expliciete lengtecheck zou
    // een ontbrekende NEXT_PUBLIC_TEAM een leeg team opleveren en zou er niemand
    // meer uren kunnen boeken.
    expect(TEAM.length).toBeGreaterThan(0);
    expect(TEAM.every((m) => m.key && m.naam)).toBe(true);
  });
});

describe("tariefUitEuro", () => {
  it("rekent euro's om naar centen", () => {
    expect(tariefUitEuro("60")).toBe(6000);
    expect(tariefUitEuro("62.50")).toBe(6250);
    expect(tariefUitEuro("62,50")).toBe(6250);
  });

  it("geeft nul bij ontbrekende of onzinnige invoer", () => {
    // Nul valt op de verdienstenpagina meteen op; een verzonnen bedrag zou stil
    // op een factuur belanden.
    expect(tariefUitEuro(undefined)).toBe(0);
    expect(tariefUitEuro("")).toBe(0);
    expect(tariefUitEuro("gratis")).toBe(0);
    expect(tariefUitEuro("-10")).toBe(0);
  });
});

describe("parseUren", () => {
  it("leest hele en decimale uren, met komma of punt", () => {
    expect(parseUren("2")).toBe(120);
    expect(parseUren("2,5")).toBe(150);
    expect(parseUren("2.5")).toBe(150);
  });

  it("leest de klokvorm", () => {
    expect(parseUren("1:30")).toBe(90);
    expect(parseUren("0:45")).toBe(45);
    expect(parseUren("10:05")).toBe(605);
  });

  it("leest minuten met een achtervoegsel", () => {
    expect(parseUren("90m")).toBe(90);
    expect(parseUren("90min")).toBe(90);
  });

  it("leest uren met een achtervoegsel", () => {
    expect(parseUren("2u")).toBe(120);
    expect(parseUren("2uur")).toBe(120);
  });

  it("negeert hoofdletters en spaties", () => {
    expect(parseUren("  2 UUR ")).toBe(120);
    expect(parseUren("1 : 30")).toBe(90);
  });

  it("rondt af op hele minuten", () => {
    // 1,005 uur = 60,3 minuten
    expect(parseUren("1,005")).toBe(60);
  });

  it("geeft null bij invoer waar geen tijd in zit", () => {
    expect(parseUren("")).toBeNull();
    expect(parseUren("   ")).toBeNull();
    expect(parseUren("veel")).toBeNull();
    expect(parseUren("-2")).toBeNull();
    expect(parseUren("1:75")).toBeNull(); // 75 minuten bestaat niet
  });
});

describe("verdiensteCents", () => {
  it("rekent klantwerk tegen het klanttarief", () => {
    expect(verdiensteCents(60, "klant")).toBe(TARIEF_KLANT_CENTS);
    expect(verdiensteCents(30, "klant")).toBe(Math.round(TARIEF_KLANT_CENTS / 2));
  });

  it("rekent bedrijfswerk tegen het bedrijfstarief", () => {
    expect(verdiensteCents(60, "bedrijf")).toBe(TARIEF_BEDRIJF_CENTS);
    // Niet meer of het bedrijfstarief lager ís — dat is een keuze in de
    // configuratie, geen belofte van deze code. Wel dat de twee tarieven uit
    // elkaar worden gehouden.
    expect(TARIEF_BEDRIJF_CENTS).not.toBe(TARIEF_KLANT_CENTS);
  });

  it("behandelt een onbekend soort als klantwerk", () => {
    // Bewust: een typefout in de database mag geen uren gratis maken.
    expect(verdiensteCents(60, "onzin")).toBe(TARIEF_KLANT_CENTS);
  });

  it("rondt af op hele centen", () => {
    expect(Number.isInteger(verdiensteCents(7, "klant"))).toBe(true);
  });
});

describe("uurNaarFactuurregel", () => {
  it("zet de werkdatum voor de omschrijving", () => {
    const r = uurNaarFactuurregel(uur({ omschrijving: "Homepage ontwerp" }));
    expect(r.omschrijving).toContain("Homepage ontwerp");
    expect(r.omschrijving).toMatch(/^\d{1,2} \w+ 2026 — /);
  });

  it("laat alleen de datum staan als er geen omschrijving is", () => {
    expect(uurNaarFactuurregel(uur({ omschrijving: null })).omschrijving).not.toContain("—");
    expect(uurNaarFactuurregel(uur({ omschrijving: "   " })).omschrijving).not.toContain("—");
  });

  it("geeft het aantal met twee decimalen, zodat het op numeric(10,2) past", () => {
    expect(uurNaarFactuurregel(uur({ minuten: 150 })).aantal).toBe("2.50");
    expect(uurNaarFactuurregel(uur({ minuten: 60 })).aantal).toBe("1.00");
    expect(uurNaarFactuurregel(uur({ minuten: 20 })).aantal).toBe("0.33");
  });

  it("houdt het uur-id vast, zodat het bij opslaan afgeboekt kan worden", () => {
    expect(uurNaarFactuurregel(uur({ id: 42 })).uurId).toBe(42);
  });

  it("rekent tegen het klanttarief", () => {
    expect(uurNaarFactuurregel(uur()).prijsCents).toBe(TARIEF_KLANT_CENTS);
  });
});

describe("groepeerUren", () => {
  const klanten = [
    { id: 1, bedrijf: "Bakkerij de Korenbloem" },
    { id: 2, bedrijf: "Atelier Nienke Bos" },
  ];

  it("toont ook klanten zonder geboekte uren", () => {
    const groepen = groepeerUren([], klanten);
    expect(groepen.map((g) => g.naam)).toContain("Atelier Nienke Bos");
  });

  it("zet bedrijfswerk apart, ongeacht de klant op de regel", () => {
    const groepen = groepeerUren([uur({ soort: "bedrijf", clientId: null })], klanten);
    const bedrijf = groepen.find((g) => g.sleutel === "bedrijf");
    expect(bedrijf?.totaalMinuten).toBe(60);
  });

  it("bewaart klantwerk van een verwijderde klant in een eigen groep", () => {
    // De reden dat `soort` naast `clientId` staat: verdwijnt de klant, dan blijft
    // het klantwerk zichtbaar in plaats van als bedrijfsuren te tellen.
    const groepen = groepeerUren([uur({ soort: "klant", clientId: null })], klanten);
    const verwijderd = groepen.find((g) => g.sleutel === "verwijderd");
    expect(verwijderd?.totaalMinuten).toBe(60);
  });

  it("laat de groep Verwijderde klanten weg als die leeg is", () => {
    expect(groepeerUren([uur()], klanten).some((g) => g.sleutel === "verwijderd")).toBe(false);
  });

  it("sorteert klanten op geboekte tijd, meeste eerst", () => {
    const groepen = groepeerUren(
      [uur({ id: 1, clientId: 2, minuten: 300 }), uur({ id: 2, clientId: 1, minuten: 60 })],
      klanten
    );
    expect(groepen[0].naam).toBe("Atelier Nienke Bos");
  });

  it("telt minuten per teamlid op binnen een groep", () => {
    const groepen = groepeerUren(
      [
        uur({ id: 1, medewerker: "sijmen", minuten: 60 }),
        uur({ id: 2, medewerker: "sijmen", minuten: 30 }),
      ],
      klanten
    );
    expect(groepen.find((g) => g.clientId === 1)?.totalen.sijmen).toBe(90);
  });
});

describe("berekenVerdiensten", () => {
  const rijen = [
    uur({ id: 1, medewerker: "sijmen", soort: "klant", minuten: 120, datum: "2026-08-03" }),
    uur({ id: 2, medewerker: "sijmen", soort: "bedrijf", minuten: 60, datum: "2026-08-10" }),
    uur({ id: 3, medewerker: "sijmen", soort: "klant", minuten: 60, datum: "2026-07-20" }),
  ];

  it("splitst klant- en bedrijfsminuten", () => {
    const rij = berekenVerdiensten(rijen).find((r) => r.medewerker === "sijmen")!;
    expect(rij.klantMinuten).toBe(180);
    expect(rij.bedrijfMinuten).toBe(60);
    expect(rij.totaalMinuten).toBe(240);
  });

  it("rekent elk soort tegen zijn eigen tarief", () => {
    const rij = berekenVerdiensten(rijen).find((r) => r.medewerker === "sijmen")!;
    expect(rij.centen).toBe(3 * TARIEF_KLANT_CENTS + 1 * TARIEF_BEDRIJF_CENTS);
  });

  it("filtert op maand als die is meegegeven", () => {
    const rij = berekenVerdiensten(rijen, "2026-07").find((r) => r.medewerker === "sijmen")!;
    expect(rij.totaalMinuten).toBe(60);
  });

  it("geeft elk teamlid een rij, ook zonder geboekte uren", () => {
    const rijenUit = berekenVerdiensten([]);
    expect(rijenUit.length).toBeGreaterThan(0);
    expect(rijenUit.every((r) => r.totaalMinuten === 0 && r.centen === 0)).toBe(true);
  });

  it("laat uren van iemand buiten het team niet verdwijnen", () => {
    // Een oud teamlid, of een verkeerd ingestelde NEXT_PUBLIC_TEAM: de uren
    // moeten zichtbaar blijven, want geld dat je niet ziet is erger dan een rij
    // met een onbekende naam erin.
    const rij = berekenVerdiensten([
      uur({ id: 9, medewerker: "onbekend-persoon", soort: "klant", minuten: 120 }),
    ]).find((r) => r.medewerker === "onbekend-persoon");

    expect(rij).toBeDefined();
    expect(rij!.klantMinuten).toBe(120);
    expect(rij!.centen).toBe(2 * TARIEF_KLANT_CENTS);
  });
});

describe("maandenMetUren", () => {
  it("geeft de maanden nieuwste eerst, zonder dubbele", () => {
    expect(
      maandenMetUren([
        uur({ id: 1, datum: "2026-07-01" }),
        uur({ id: 2, datum: "2026-08-15" }),
        uur({ id: 3, datum: "2026-08-02" }),
      ])
    ).toEqual(["2026-08", "2026-07"]);
  });
});
