import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Modellen per taak, gekozen op kosten/kwaliteit:
 * - Categoriseren is simpel classificatiewerk → Haiku (goedkoopst).
 * - Concepten schrijven + stijl distilleren vraagt taalgevoel → Sonnet.
 * Bewust géén Opus meer: fors duurder zonder merkbaar betere mails hier.
 */
export const MODEL_CATEGORIZE = "claude-haiku-4-5";
export const MODEL_DRAFT = "claude-sonnet-5";

// Lazy: pas een client maken bij het eerste gebruik, zodat een build zonder
// ANTHROPIC_API_KEY niet faalt.
let cached: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!cached) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        "ANTHROPIC_API_KEY ontbreekt. Zet deze in .env.local (lokaal) of in de Vercel-omgevingsvariabelen."
      );
    }
    cached = new Anthropic();
  }
  return cached;
}

/** Haalt de aaneengeschakelde tekst uit een Claude-antwoord. */
export function textOf(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}
