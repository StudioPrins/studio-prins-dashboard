/**
 * Velddefinities voor het intakeformulier. Op één plek zodat het formulier,
 * de e-mail en de weergave op de klantpagina consistent blijven.
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
 * en gebruikt op facturen.
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

/**
 * Vrije wensen voor de website. Deze worden als JSON in `clients.intake`
 * opgeslagen (Record<naam, waarde>).
 */
export const WEBSITE_FIELDS: IntakeField[] = [
  { name: "domeinnaam", label: "Gewenste domeinnaam", placeholder: "bijv. mijnbedrijf.nl" },
  { name: "doel", label: "Wat is het doel van de website?", textarea: true, placeholder: "Bijv. meer klanten, online reserveren, informatie geven…" },
  { name: "doelgroep", label: "Wie is de doelgroep?", placeholder: "Wie moet de site bereiken?" },
  { name: "stijl", label: "Gewenste stijl & uitstraling", textarea: true, placeholder: "Kleuren, sfeer, voorbeelden van huisstijl…" },
  { name: "paginas", label: "Welke pagina's wil je?", placeholder: "Home, Over ons, Diensten, Contact…" },
  { name: "functies", label: "Gewenste functionaliteiten", textarea: true, placeholder: "Contactformulier, webshop, agenda, nieuwsbrief…" },
  { name: "socials", label: "Social media", placeholder: "Links naar Instagram, Facebook, LinkedIn…" },
  { name: "voorbeelden", label: "Voorbeeldwebsites die je mooi vindt", textarea: true, placeholder: "Plak hier een paar links met wat je er mooi aan vindt" },
  { name: "opmerkingen", label: "Overige opmerkingen", textarea: true, placeholder: "Alles wat verder handig is om te weten" },
];

/** Labels opzoekbaar maken voor weergave van opgeslagen intake-antwoorden. */
export const WEBSITE_FIELD_LABELS: Record<string, string> = Object.fromEntries(
  WEBSITE_FIELDS.map((f) => [f.name, f.label])
);
