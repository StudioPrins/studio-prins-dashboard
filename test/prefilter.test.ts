import { describe, expect, it } from "vitest";
import { heuristicCategory, type PrefilterInput } from "@/lib/mail/prefilter";

/**
 * De gratis vóórfilter draait vóór de betaalde classificatie. Zijn waarde zit
 * niet in wat hij vangt maar in wat hij met rust laat: één klantmail die als
 * ruis wordt weggezet kost meer dan alle bespaarde API-calls samen.
 */

function mail(over: Partial<PrefilterInput> = {}): PrefilterInput {
  return {
    fromAddress: "iemand@voorbeeld.nl",
    subject: "Onderwerp",
    bodyText: "Wat tekst.",
    bodyHtml: null,
    ...over,
  };
}

describe("heuristicCategory", () => {
  it("herkent een nieuwsbrief aan afmeldtaal, in beide talen", () => {
    expect(heuristicCategory(mail({ bodyText: "You can unsubscribe here." }))).toBe("nieuwsbrief");
    expect(heuristicCategory(mail({ bodyText: "Afmelden voor deze nieuwsbrief" }))).toBe("nieuwsbrief");
    expect(heuristicCategory(mail({ bodyText: "Manage your preferences" }))).toBe("nieuwsbrief");
  });

  it("kijkt ook in het onderwerp en de HTML-versie", () => {
    expect(heuristicCategory(mail({ subject: "Unsubscribe", bodyText: null }))).toBe("nieuwsbrief");
    expect(
      heuristicCategory(mail({ bodyText: null, bodyHtml: '<a href="#">Uitschrijven</a>' }))
    ).toBe("nieuwsbrief");
  });

  it("herkent geautomatiseerde afzenders, ook met leestekens ertussen", () => {
    expect(heuristicCategory(mail({ fromAddress: "noreply@vercel.com" }))).toBe("notificatie");
    expect(heuristicCategory(mail({ fromAddress: "no-reply@vercel.com" }))).toBe("notificatie");
    expect(heuristicCategory(mail({ fromAddress: "no.reply@vercel.com" }))).toBe("notificatie");
    expect(heuristicCategory(mail({ fromAddress: "notifications@github.com" }))).toBe("notificatie");
    expect(heuristicCategory(mail({ fromAddress: "MAILER-DAEMON@host.nl" }))).toBe("notificatie");
  });

  it("laat afmeldtaal voorgaan op de afzender", () => {
    // Een nieuwsbrief van een noreply-adres is eerst een nieuwsbrief.
    expect(
      heuristicCategory(mail({ fromAddress: "noreply@shop.nl", bodyText: "Unsubscribe" }))
    ).toBe("nieuwsbrief");
  });

  it("laat gewone mail met rust, zodat de AI erover beslist", () => {
    expect(heuristicCategory(mail())).toBeNull();
    expect(heuristicCategory(mail({ fromAddress: null, subject: null, bodyText: null }))).toBeNull();
  });

  it("kent nooit een oordeelscategorie toe", () => {
    // De hele opzet: alleen de vormelijke gevallen, nooit iets dat inhoudelijk
    // oordeel vraagt. Zo kan de filter geen klantmail verkeerd wegzetten.
    const gevallen: PrefilterInput[] = [
      mail({ fromAddress: "marijke@klant.nl", bodyText: "Kun je dit even aanpassen?" }),
      mail({ fromAddress: "sales@spam.biz", bodyText: "Wij bouwen websites voor u!" }),
      mail({ fromAddress: "noreply@bank.nl", bodyText: "Uw factuur van 895 euro" }),
      mail({ bodyText: "Unsubscribe" }),
    ];
    for (const g of gevallen) {
      expect(["nieuwsbrief", "notificatie", null]).toContain(heuristicCategory(g));
    }
  });

  it("ziet een adres zonder apenstaartje niet aan voor een notificatie", () => {
    expect(heuristicCategory(mail({ fromAddress: "" }))).toBeNull();
  });
});
