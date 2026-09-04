import { describe, expect, it } from "vitest";
import {
  editRatio,
  isMeaningfulEdit,
  normalizeForCompare,
  wordDiff,
  type DiffSegment,
} from "@/lib/mail/diff";

/**
 * Het verschil tussen het Claude-concept en de verstuurde tekst is het hele
 * leersignaal van de mailassistent. Twee eigenschappen zijn daarbij belangrijker
 * dan mooie diffs: een ongewijzigd verstuurd concept mag nooit als correctie
 * gelden (anders leert de assistent van ruis), en de tekst moet uit de segmenten
 * exact terug te bouwen zijn (anders liegt de weergave).
 */

/** Bouwt de oorspronkelijke twee teksten terug uit de segmenten. */
function reconstruct(segments: DiffSegment[]): { before: string; after: string } {
  let before = "";
  let after = "";
  for (const s of segments) {
    if (s.type !== "toegevoegd") before += s.text;
    if (s.type !== "verwijderd") after += s.text;
  }
  return { before, after };
}

const CONCEPT = `Hoi Marijke,

Bedankt voor je bericht. Ik ga ernaar kijken en kom er zo snel mogelijk op terug.

Met vriendelijke groet,
Sijmen`;

const VERSTUURD = `Hoi Marijke,

Helder, ik pak het donderdag op.

Groet,
Sijmen`;

describe("normalizeForCompare", () => {
  it("maakt whitespace-verschillen onzichtbaar", () => {
    expect(normalizeForCompare("Hoi   Marijke\n\n\nGroet")).toBe("Hoi Marijke Groet");
    expect(normalizeForCompare("  Groet, Sijmen  ")).toBe("Groet, Sijmen");
  });
});

describe("isMeaningfulEdit", () => {
  it("is onwaar bij een ongewijzigd verstuurd concept", () => {
    expect(isMeaningfulEdit(CONCEPT, CONCEPT)).toBe(false);
  });

  it("is onwaar bij alleen andere witruimte", () => {
    expect(isMeaningfulEdit("Groet,\nSijmen", "Groet,\n\n  Sijmen ")).toBe(false);
  });

  it("is waar zodra er een woord verandert", () => {
    expect(isMeaningfulEdit("Groet, Sijmen", "Groeten, Sijmen")).toBe(true);
    expect(isMeaningfulEdit(CONCEPT, VERSTUURD)).toBe(true);
  });
});

describe("wordDiff", () => {
  it("geeft alleen 'gelijk' terug bij identieke tekst", () => {
    const segments = wordDiff(CONCEPT, CONCEPT);
    expect(segments.every((s) => s.type === "gelijk")).toBe(true);
    expect(segments.map((s) => s.text).join("")).toBe(CONCEPT);
  });

  it("markeert één vervangen woord als verwijderd plus toegevoegd", () => {
    const segments = wordDiff("Hoi Marijke, groet", "Hoi Anouk, groet");
    const gewijzigd = segments.filter((s) => s.type !== "gelijk");
    expect(gewijzigd).toEqual([
      { type: "verwijderd", text: "Marijke," },
      { type: "toegevoegd", text: "Anouk," },
    ]);
  });

  it("houdt de onveranderde aanhef en ondertekening buiten de wijziging", () => {
    const segments = wordDiff(CONCEPT, VERSTUURD);
    expect(segments[0].type).toBe("gelijk");
    expect(segments[0].text.startsWith("Hoi Marijke,")).toBe(true);
    expect(segments[segments.length - 1].text.endsWith("Sijmen")).toBe(true);
  });

  it("slokt losse functiewoorden op in plaats van er confetti van te maken", () => {
    // Een herschreven zin die toevallig "ik" en "het" deelt met het origineel.
    // Zonder opschoonpas levert dat losse gelijk-eilandjes op.
    const segments = wordDiff(
      "Ik zal er zo snel mogelijk naar kijken en kom er bij je op terug.",
      "Ik pak het woensdag op en laat het je dan weten."
    );
    const types = segments.map((s) => s.type);
    expect(types).toEqual(["gelijk", "verwijderd", "toegevoegd"]);
    expect(segments[0].text).toBe("Ik ");
  });

  it("zet binnen een wijziging altijd het oude vóór het nieuwe", () => {
    const segments = wordDiff("aap noot mies wim", "aap zus jet wim");
    expect(segments.map((s) => s.type)).toEqual([
      "gelijk",
      "verwijderd",
      "toegevoegd",
      "gelijk",
    ]);
  });

  it("kan beide teksten exact terugbouwen", () => {
    const { before, after } = reconstruct(wordDiff(CONCEPT, VERSTUURD));
    expect(before).toBe(CONCEPT);
    expect(after).toBe(VERSTUURD);
  });

  it("gaat om met een leeg concept of een leeg antwoord", () => {
    expect(wordDiff("", "Groet, Sijmen")).toEqual([
      { type: "toegevoegd", text: "Groet, Sijmen" },
    ]);
    expect(wordDiff("Groet, Sijmen", "")).toEqual([
      { type: "verwijderd", text: "Groet, Sijmen" },
    ]);
    expect(wordDiff("", "")).toEqual([]);
  });
});

describe("editRatio", () => {
  it("is 0 bij een ongewijzigd verstuurd concept", () => {
    expect(editRatio(CONCEPT, CONCEPT)).toBe(0);
    expect(editRatio("Groet,\nSijmen", "Groet,\n\nSijmen")).toBe(0);
  });

  it("is 1 bij volledig andere tekst", () => {
    expect(editRatio("aap noot mies", "wim zus jet")).toBe(1);
  });

  it("ligt daartussen bij een gedeeltelijke correctie", () => {
    const ratio = editRatio(CONCEPT, VERSTUURD);
    expect(ratio).toBeGreaterThan(0);
    expect(ratio).toBeLessThan(1);
  });

  it("weegt een kleine correctie licht", () => {
    // Eén woord van de tien vervangen: twee gewijzigde woorden op twintig.
    const a = "een twee drie vier vijf zes zeven acht negen tien";
    const b = "een twee drie vier vijf zes zeven acht negen elf";
    expect(editRatio(a, b)).toBeCloseTo(0.1, 5);
  });
});
