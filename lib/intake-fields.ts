/**
 * Velddefinities voor het intakeformulier.
 *
 * De bedrijfsgegevens (BILLING_FIELDS) liggen vast: ze schrijven naar echte
 * kolommen op de klant en worden op facturen gebruikt. De websitewensen zijn
 * beheerbaar via /instellingen en staan in de tabel `intake_fields`; de lijst
 * hieronder is alleen nog de seed-standaard bij het aanmaken van die tabel.
 */

export type IntakeField = {
  name: string;
  label: string;
  placeholder?: string;
  textarea?: boolean;
  type?: string;
};

/**
 * Facturatie-/bedrijfsgegevens. Deze worden opgeslagen in kolommen op de klant
 * en gebruikt op facturen. Vast — niet beheerbaar.
 */
export const BILLING_FIELDS: IntakeField[] = [
  { name: "contactpersoon", label: "Contactpersoon", placeholder: "Voor- en achternaam" },
  { name: "email", label: "E-mailadres", type: "email", placeholder: "naam@bedrijf.nl" },
  { name: "telefoon", label: "Telefoonnummer", placeholder: "06 12 34 56 78" },
  { name: "adres", label: "Straat en huisnummer", placeholder: "Voorbeeldstraat 1" },
  { name: "postcode", label: "Postcode", placeholder: "3011 AB" },
  { name: "plaats", label: "Plaats", placeholder: "Rotterdam" },
  { name: "kvk", label: "KVK-nummer", placeholder: "12345678" },
  { name: "btw", label: "Btw-nummer", placeholder: "NL001234567B01" },
  { name: "iban", label: "IBAN (voor facturen)", placeholder: "NL00 BANK 0123 4567 89" },
];

/** Soort invoerveld voor een beheerbare intakevraag. */
export type IntakeSoort = "tekst" | "tekstvak";

export type StandaardVeld = {
  naam: string;
  label: string;
  placeholder: string;
  soort: IntakeSoort;
};

/**
 * Startset websitewensen. Wordt éénmalig in `intake_fields` gezet door
 * scripts/migrate-intake-fields.ts; daarna is de tabel leidend.
 */
export const STANDAARD_WEBSITE_VELDEN: StandaardVeld[] = [
  { naam: "domeinnaam", label: "Gewenste domeinnaam", placeholder: "bijv. mijnbedrijf.nl", soort: "tekst" },
  { naam: "doel", label: "Wat is het doel van de website?", placeholder: "Bijv. meer klanten, online reserveren, informatie geven…", soort: "tekstvak" },
  { naam: "doelgroep", label: "Wie is de doelgroep?", placeholder: "Wie moet de site bereiken?", soort: "tekst" },
  { naam: "stijl", label: "Gewenste stijl & uitstraling", placeholder: "Kleuren, sfeer, voorbeelden van huisstijl…", soort: "tekstvak" },
  { naam: "paginas", label: "Welke pagina's wil je?", placeholder: "Home, Over ons, Diensten, Contact…", soort: "tekst" },
  { naam: "functies", label: "Gewenste functionaliteiten", placeholder: "Contactformulier, webshop, agenda, nieuwsbrief…", soort: "tekstvak" },
  { naam: "socials", label: "Social media", placeholder: "Links naar Instagram, Facebook, LinkedIn…", soort: "tekst" },
  { naam: "voorbeelden", label: "Voorbeeldwebsites die je mooi vindt", placeholder: "Plak hier een paar links met wat je er mooi aan vindt", soort: "tekstvak" },
  { naam: "opmerkingen", label: "Overige opmerkingen", placeholder: "Alles wat verder handig is om te weten", soort: "tekstvak" },
];

/**
 * Maakt van een vraag een stabiele sleutel voor `clients.intake`.
 * Bewust simpel gehouden: kleine letters, accenten weg, alles wat geen letter of
 * cijfer is wordt een underscore.
 */
export function slugify(label: string): string {
  const basis = label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return basis || "vraag";
}
