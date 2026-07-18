/**
 * Bedrijfsgegevens van Studio Prins.
 * Vul de placeholders hieronder in — deze verschijnen op elke factuur/offerte.
 * (KVK, btw-nummer en IBAN zijn wettelijk verplicht op een factuur.)
 */
export const BEDRIJF = {
  naam: "Studio Prins",
  tagline: "Webdesign & digitale ervaringen",
  email: "info@studioprins.nl",
  telefoon: "", // bv. "+31 6 12 34 56 78"
  website: "studioprins.nl",

  // Adres
  adres: "", // bv. "Voorbeeldstraat 1"
  postcode: "", // bv. "3011 AB"
  plaats: "", // bv. "Rotterdam"

  // Wettelijk verplicht op facturen — INVULLEN
  kvk: "", // KVK-nummer
  btw: "", // btw-id, bv. "NL0000000000B00"
  iban: "", // IBAN voor betalingen
  tenaamstelling: "", // naam op de bankrekening, indien afwijkend

  // KOR: Studio Prins valt onder de kleineondernemersregeling → geen btw.
  kor: true,
  korVermelding:
    "Studioprins valt onder de KOR, dit houdt in dat wij geen BTW rekenen op onze facturen.",
  // Standaard btw-percentage op nieuwe facturen (0 vanwege de KOR).
  standaardBtw: 0,

  // Standaard betaaltermijn: exact één maand na de factuurdatum.
  betaaltermijnMaanden: 1,
} as const;
