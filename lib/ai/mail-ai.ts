import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { anthropic, MODEL_CATEGORIZE, MODEL_DRAFT, textOf } from "./claude";
import type { MailAccount } from "@/lib/db/schema";

/* --- Categorieën ---------------------------------------------------------- */

export const MAIL_CATEGORIES = [
  "belangrijk",
  "beantwoorden",
  "nieuwsbrief",
  "notificatie",
  "onbelangrijk",
] as const;

export type MailCategory = (typeof MAIL_CATEGORIES)[number];

const CATEGORIZE_SYSTEM = `Je bent de mailassistent van Sijmen, eigenaar van Studio Prins — een eenmans-webdesignbureau. Je taak: elke binnenkomende mail in precies één categorie plaatsen zodat Sijmen snel kan schiften.

Categorieën:
- "belangrijk": van een klant, lead of over geld/facturen/opdrachten; vereist actie of kennisname, maar niet per se een direct antwoord.
- "beantwoorden": een persoonlijke mail (van een mens, geen automaat) die duidelijk een reactie van Sijmen verwacht — een vraag, verzoek of directe boodschap aan hem.
- "nieuwsbrief": marketing, mailinglijsten, updates van diensten, aanbiedingen.
- "notificatie": geautomatiseerde systeemmail (facturen van tools, bezorgbevestigingen, platformmeldingen, no-reply).
- "onbelangrijk": spam, cold outreach/acquisitie gericht aan Sijmen, irrelevante mail.

Regels:
- Twijfel je tussen "beantwoorden" en "belangrijk": kies "beantwoorden" als er een concrete vraag/verzoek aan Sijmen in staat, anders "belangrijk".
- Cold sales-mails die IETS van Sijmen willen verkopen zijn "onbelangrijk", ook al lijken ze persoonlijk.
- Beoordeel op inhoud, niet op beleefdheidsvorm.`;

const CATEGORY_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "integer" },
          categorie: { type: "string", enum: [...MAIL_CATEGORIES] },
        },
        required: ["id", "categorie"],
        additionalProperties: false,
      },
    },
  },
  required: ["items"],
  additionalProperties: false,
} as const;

export interface CategorizeInput {
  id: number;
  from: string;
  subject: string;
  text: string;
}

/**
 * Categoriseert een batch mails (max ~20 tegelijk aanroepen voor kosten/kwaliteit).
 * Retourneert een map van message-id → categorie. Ontbrekende/onparsebare
 * antwoorden laten we gewoon weg (volgende run probeert het opnieuw).
 */
export async function categorizeMails(
  mails: CategorizeInput[]
): Promise<Map<number, MailCategory>> {
  const result = new Map<number, MailCategory>();
  if (mails.length === 0) return result;

  const batchInput = mails.map((m) => ({
    id: m.id,
    van: m.from,
    onderwerp: m.subject,
    tekst: m.text.slice(0, 1500),
  }));

  const message = await anthropic().messages.create({
    model: MODEL_CATEGORIZE,
    max_tokens: 2000,
    system: [{ type: "text", text: CATEGORIZE_SYSTEM }],
    output_config: { format: { type: "json_schema", schema: CATEGORY_SCHEMA } },
    messages: [
      {
        role: "user",
        content:
          "Categoriseer deze mails. Geef voor elke id de categorie terug.\n\n" +
          JSON.stringify(batchInput),
      },
    ],
  });

  try {
    const parsed = JSON.parse(textOf(message)) as {
      items?: { id: number; categorie: string }[];
    };
    for (const item of parsed.items ?? []) {
      if ((MAIL_CATEGORIES as readonly string[]).includes(item.categorie)) {
        result.set(item.id, item.categorie as MailCategory);
      }
    }
  } catch {
    // parse-fout: laat categorieën leeg, volgende sync probeert opnieuw
  }

  return result;
}

/* --- Stijlprofiel distilleren --------------------------------------------- */

const STYLE_SYSTEM = `Je analyseert verzonden e-mails van één persoon en vat hun schrijfstijl bondig samen, zodat een assistent later mails in exact dezelfde stijl kan opstellen.

Beschrijf in korte punten (max ~200 woorden):
- Aanhef (hoe begint hij: "Hoi", "Beste", voornaam?) en of hij u of jij gebruikt.
- Afsluiting/ondertekening (exacte formuleringen, groet, naam/bedrijf).
- Toon (formeel/informeel, warm/zakelijk, kort/uitgebreid).
- Typische frasen, woordkeuze en opmaak (bullets, emoji, zinslengte).
Geef alleen de samenvatting terug, geen inleiding.`;

export async function distillStyleProfile(
  examples: { subject: string | null; bodyText: string }[]
): Promise<string> {
  if (examples.length === 0) return "";

  const sample = examples
    .slice(0, 50)
    .map(
      (e, i) =>
        `--- Voorbeeld ${i + 1} (onderwerp: ${e.subject ?? "—"}) ---\n${e.bodyText}`
    )
    .join("\n\n");

  const message = await anthropic().messages.create({
    model: MODEL_DRAFT,
    max_tokens: 2000,
    thinking: { type: "adaptive" },
    system: [{ type: "text", text: STYLE_SYSTEM }],
    messages: [{ role: "user", content: sample }],
  });

  return textOf(message);
}

/* --- Conceptantwoord genereren -------------------------------------------- */

const DRAFT_PERSONA = `Je bent de persoonlijke mailassistent van Sijmen (Studio Prins, eenmans-webdesignbureau). Je schrijft conceptantwoorden die Sijmen alleen nog hoeft te controleren en te versturen.

Belangrijk:
- Schrijf UITSLUITEND de tekst van het antwoord — geen onderwerpregel, geen uitleg, geen "hier is je concept".
- Antwoord in dezelfde taal als de ontvangen mail (meestal Nederlands).
- Neem Sijmens schrijfstijl exact over: aanhef, afsluiting, toon en woordkeuze uit de meegegeven voorbeelden.
- Beantwoord concreet de vraag/inhoud van de mail. Verzin geen feiten, prijzen of toezeggingen die je niet weet; houd het dan algemeen of stel een verduidelijkende wedervraag.
- Wees beknopt en natuurlijk, zoals Sijmen zelf zou schrijven.
- Krijg je correcties op eerdere concepten mee, pas die patronen dan meteen toe. Dat is Sijmens directe feedback op jouw werk en weegt zwaarder dan de algemene stijlbeschrijving.`;

export interface DraftMessage {
  fromName: string | null;
  fromAddress: string | null;
  subject: string | null;
  date: Date | null;
  bodyText: string | null;
}

/** Een concept dat Sijmen aanpaste voordat hij het verstuurde. */
export interface MailCorrection {
  concept: string;
  verstuurd: string;
}

/** Per kant afkappen: het patroon van een correctie zit in de eerste alinea's. */
const MAX_CORRECTION_CHARS = 1500;

function correctionBlock(corrections: MailCorrection[]): string {
  const shown = corrections
    .map(
      (c, i) =>
        `Correctie ${i + 1}\n` +
        `Jouw concept:\n${c.concept.slice(0, MAX_CORRECTION_CHARS)}\n\n` +
        `Wat Sijmen ervan maakte en verstuurde:\n${c.verstuurd.slice(0, MAX_CORRECTION_CHARS)}`
    )
    .join("\n\n---\n\n");

  return `\nCorrecties van Sijmen op jouw eerdere concepten. Eerst wat jij schreef, daarna wat hij er daadwerkelijk van maakte. Leer hieruit het patroon van zijn correcties — toon, lengte, formulering, wat hij standaard schrapt of juist toevoegt. Niet de inhoud: die hoorde bij die ene mail.\n\n${shown}`;
}

function styleBlock(
  account: MailAccount,
  examples: { subject: string | null; bodyText: string }[],
  corrections: MailCorrection[]
): string {
  const parts: string[] = [];
  parts.push(`Afzender-identiteit: ${account.naam} <${account.email}>.`);
  if (account.styleProfile) {
    parts.push(`\nSchrijfstijl van Sijmen:\n${account.styleProfile}`);
  }
  if (examples.length > 0) {
    const shown = examples
      .slice(0, 8)
      .map((e, i) => `Voorbeeld ${i + 1}:\n${e.bodyText}`)
      .join("\n\n");
    parts.push(`\nEnkele eerder verzonden mails ter referentie:\n${shown}`);
  }
  // Als laatste, zodat het dichtst bij de opdracht staat: dit is de scherpste
  // feedback die we hebben.
  if (corrections.length > 0) {
    parts.push(correctionBlock(corrections));
  }
  return parts.join("\n");
}

function mailContext(message: DraftMessage): string {
  const van = message.fromName
    ? `${message.fromName} <${message.fromAddress ?? ""}>`
    : message.fromAddress ?? "onbekend";
  const body = (message.bodyText ?? "").slice(0, 6000);
  return [
    "Schrijf een conceptantwoord op deze mail:",
    "",
    `Van: ${van}`,
    `Onderwerp: ${message.subject ?? "(geen onderwerp)"}`,
    message.date ? `Datum: ${message.date.toLocaleString("nl-NL")}` : "",
    "",
    "Inhoud:",
    body,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Genereert een conceptantwoord in Sijmens stijl. De system-prompt is
 * opgebouwd als stabiele prefix (persona + stijl + voorbeelden + correcties) met
 * een cache-breakpoint, zodat opeenvolgende antwoorden op hetzelfde account de
 * prompt-cache benutten.
 *
 * De correcties zitten bewust ín die prefix en niet bij de losse mail: ze gelden
 * voor het hele account. Het blok verandert daardoor alleen ná een verzending
 * waarin Sijmen iets aanpaste — dan mist de cache één keer, en is het signaal
 * meteen actueel. Bij een handvol mails per dag is dat de juiste ruil.
 */
export async function generateDraft(
  account: MailAccount,
  message: DraftMessage,
  examples: { subject: string | null; bodyText: string }[],
  corrections: MailCorrection[] = []
): Promise<string> {
  const system: Anthropic.TextBlockParam[] = [
    { type: "text", text: DRAFT_PERSONA },
    {
      type: "text",
      text: styleBlock(account, examples, corrections),
      cache_control: { type: "ephemeral" },
    },
  ];

  const response = await anthropic().messages.create({
    model: MODEL_DRAFT,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system,
    messages: [{ role: "user", content: mailContext(message) }],
  });

  return textOf(response);
}
