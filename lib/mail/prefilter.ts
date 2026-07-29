import "server-only";
import type { MailCategory } from "@/lib/ai/mail-ai";

/**
 * Gratis, regel-gebaseerde vóórfilter. Vangt de overduidelijke gevallen af
 * (nieuwsbrieven, geautomatiseerde systeemmail) zodat die niet naar de betaalde
 * Claude-API hoeven. Bij twijfel geeft hij `null` terug — dan beslist de AI.
 *
 * Bewust conservatief: kent NOOIT "belangrijk"/"beantwoorden"/"onbelangrijk"
 * toe, want dat vergt inhoudelijk oordeel. De duurste fout (een klantmail
 * wegzetten als ruis) wordt zo vermeden: echte persoonlijke mail komt vrijwel
 * nooit van een noreply-adres en bevat geen afmeldlink.
 */

// Afzender-local-parts (genormaliseerd, zonder scheidingstekens) die duiden op
// geautomatiseerde afzenders.
const NOTIFICATION_SENDERS = [
  "noreply",
  "donotreply",
  "donotrespond",
  "notification",
  "notifications",
  "notify",
  "mailerdaemon",
  "postmaster",
  "bounce",
  "bounces",
  "automated",
  "autoreply",
  "autoconfirm",
  "geenantwoord",
];

// Tekst die vrijwel altijd op een nieuwsbrief/mailinglijst duidt.
const NEWSLETTER_PHRASES = [
  "unsubscribe",
  "uitschrijven",
  "afmelden",
  "meld je af",
  "meld u af",
  "je afmelden",
  "u afmelden",
  "afmelden voor deze",
  "geen nieuwsbrief meer",
  "geen e-mails meer",
  "geen mails meer",
  "manage your preferences",
  "manage preferences",
  "no longer wish to receive",
  "opt out",
  "opt-out",
  "view this email in your browser",
  "bekijk deze e-mail in je browser",
  "bekijk deze mail in je browser",
];

function normalizedLocalPart(address: string | null): string {
  if (!address) return "";
  const lower = address.toLowerCase();
  const at = lower.indexOf("@");
  const local = at >= 0 ? lower.slice(0, at) : lower;
  return local.replace(/[^a-z0-9]/g, ""); // "no-reply" → "noreply"
}

export interface PrefilterInput {
  fromAddress: string | null;
  subject: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
}

export function heuristicCategory(msg: PrefilterInput): MailCategory | null {
  const haystack = `${msg.subject ?? ""}\n${msg.bodyText ?? ""}\n${
    msg.bodyHtml ?? ""
  }`.toLowerCase();

  // Nieuwsbrief: expliciete afmeld-/mailinglijst-taal in de mail.
  if (NEWSLETTER_PHRASES.some((p) => haystack.includes(p))) {
    return "nieuwsbrief";
  }

  // Notificatie: duidelijk geautomatiseerde afzender.
  const local = normalizedLocalPart(msg.fromAddress);
  if (local && NOTIFICATION_SENDERS.some((s) => local.includes(s))) {
    return "notificatie";
  }

  return null;
}
