import { describe, expect, it } from "vitest";
import { stripQuoted } from "@/lib/mail/quote";
import { pickStyleExamples, threadKey } from "@/lib/mail/style-examples";

/**
 * De stijlvoorbeelden bepalen hoe de mailassistent klinkt. Twee dingen kunnen
 * daar stilletjes misgaan, en allebei zijn ze in productie misgegaan:
 *
 * 1. Het citaat bleef staan, waardoor het "voorbeeld" ook de aanhef en
 *    afsluiting van de gesprekspartner bevatte.
 * 2. De acht nieuwste mails bleken zes keer dezelfde thread.
 */

describe("stripQuoted", () => {
  it("laat een mail zonder citaat ongemoeid", () => {
    const tekst = "Hi Rosanne,\n\nDat is gelukt.\n\nMet vriendelijke groet,\nSijmen";
    expect(stripQuoted(tekst)).toBe(tekst);
  });

  it("kapt af op het Outlook-headerblok — het geval dat in productie doorglipte", () => {
    const tekst = [
      "Hi Rosanne,",
      "",
      "Ik zit in de meeting! Tot straks.",
      "",
      "Van: Rosanne op den Kelder <r@voorbeeld.nl>",
      "Verzonden: donderdag 28 mei 2026 10:51",
      "Aan: Sijmen",
      "Onderwerp: Re: Facturen",
      "",
      "Hoi Sijmen, zullen we bellen?",
      "Groet,",
      "Rosanne",
    ].join("\n");
    expect(stripQuoted(tekst)).toBe("Hi Rosanne,\n\nIk zit in de meeting! Tot straks.");
  });

  it("kapt af op de Outlook-scheidingslijn boven dat blok", () => {
    const tekst = "Hoi,\n\nPrima.\n\n________________________________\nVan: iemand\nGroet, iemand";
    expect(stripQuoted(tekst)).toBe("Hoi,\n\nPrima.");
  });

  it("kent de Gmail- en Apple-varianten nog steeds, in beide talen", () => {
    expect(stripQuoted("Ja hoor.\n\nOp 3 juli 2026 schreef Jan <j@x.nl>:\n> en?")).toBe("Ja hoor.");
    expect(stripQuoted("Sure.\n\nOn Jul 3, 2026, Jan wrote:\n> and?")).toBe("Sure.");
    expect(stripQuoted("Klopt.\n\n----- Oorspronkelijk bericht -----\nVan: Jan")).toBe("Klopt.");
    expect(stripQuoted("Klaar.\n\n--- Doorgestuurd bericht ---\nVan: Jan")).toBe("Klaar.");
  });

  it("gooit losse >-regels weg zonder de rest af te kappen", () => {
    expect(stripQuoted("Eens.\n> jouw vraag\nEn tot morgen.")).toBe("Eens.\nEn tot morgen.");
  });

  it("houdt een streepje-handtekening heel: die is korter dan de citaatlijn", () => {
    expect(stripQuoted("Groet,\nSijmen\n--\nStudio Prins")).toBe("Groet,\nSijmen\n--\nStudio Prins");
  });
});

describe("threadKey", () => {
  it("ziet antwoorden en doorstuurtjes als dezelfde thread", () => {
    const k = threadKey("Offerte", 0);
    expect(threadKey("Re: Offerte", 1)).toBe(k);
    expect(threadKey("RE: FWD: Offerte", 2)).toBe(k);
    expect(threadKey("Antw: Offerte", 3)).toBe(k);
    expect(threadKey("AW: Offerte", 4)).toBe(k);
  });

  it("houdt verschillende onderwerpen uit elkaar", () => {
    expect(threadKey("Offerte", 0)).not.toBe(threadKey("Factuur", 1));
  });

  it("geeft mails zonder onderwerp elk een eigen sleutel", () => {
    expect(threadKey(null, 0)).not.toBe(threadKey(null, 1));
    expect(threadKey("", 0)).not.toBe(threadKey("  ", 1));
  });
});

describe("pickStyleExamples", () => {
  const mail = (subject: string, merk: string) => ({ subject, bodyText: merk });

  it("neemt eerst uit elke thread één mail voordat het er een tweede pakt", () => {
    const gekozen = pickStyleExamples(
      [
        mail("Re: Facturen", "A1"),
        mail("Re: Facturen", "A2"),
        mail("Re: Facturen", "A3"),
        mail("Meeting", "B1"),
        mail("Nieuwe site", "C1"),
      ],
      4
    );
    expect(gekozen.map((e) => e.bodyText)).toEqual(["A1", "B1", "C1", "A2"]);
  });

  it("lost het geval op waar dit voor gemaakt is: zes van de acht dezelfde thread", () => {
    const invoer = [
      ...Array.from({ length: 6 }, (_, i) => mail("Re: Facturen TF-CBT", `thread-${i}`)),
      mail("Uitnodiging meeting", "los-1"),
      mail("Plan van aanpak", "los-2"),
      mail("Hosting verlengen", "los-3"),
      mail("Domeinnaam", "los-4"),
    ];
    const uit = pickStyleExamples(invoer, 8);
    const uitDeThread = uit.filter((e) => e.bodyText.startsWith("thread-")).length;
    expect(uit).toHaveLength(8);
    expect(uitDeThread).toBe(4); // was 6 van de 8; nu deelt hij met de anderen
    expect(new Set(uit.map((e) => threadKey(e.subject, 0))).size).toBe(5);
  });

  it("verandert niets als er minder voorbeelden zijn dan gevraagd", () => {
    const invoer = [mail("A", "a"), mail("B", "b")];
    expect(pickStyleExamples(invoer, 8)).toEqual(invoer);
  });

  it("is deterministisch — anders mist de prompt-cache elke aanroep", () => {
    const invoer = [mail("A", "a1"), mail("B", "b1"), mail("A", "a2")];
    expect(pickStyleExamples(invoer, 2)).toEqual(pickStyleExamples(invoer, 2));
  });

  it("geeft een lege lijst terug bij lege invoer of n = 0", () => {
    expect(pickStyleExamples([], 8)).toEqual([]);
    expect(pickStyleExamples([mail("A", "a")], 0)).toEqual([]);
  });
});
