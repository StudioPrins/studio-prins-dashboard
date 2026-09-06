import "server-only";

/**
 * Kiest welke verzonden mails als stijlvoorbeeld de prompt in gaan.
 *
 * Eerder was dat simpelweg "de acht nieuwste". Dat klinkt redelijk, maar het
 * stort in zodra je een tijdje intensief met één klant mailt: van mijn acht
 * nieuwste waren er zes dezelfde thread met dezelfde persoon. Het model kreeg
 * dan één gesprek te zien en las dat als "de" schrijfstijl.
 *
 * Daarom round-robin over threads in plaats van een platte kop van de lijst:
 * eerst uit elke thread de nieuwste mail, dan pas een tweede uit de threads die
 * er meer hebben. Bij weinig threads levert dat exact hetzelfde op als vroeger,
 * bij veel threads een veel bredere doorsnede. Deterministisch, zodat de
 * prompt-cache niet elke aanroep mist.
 */

export interface StyleExampleLike {
  subject: string | null;
  bodyText: string;
}

/**
 * Sleutel waarop we mails als één gesprek beschouwen: het onderwerp zonder de
 * antwoord-/doorstuurprefixen. "Re: Fwd: RE: Offerte" en "Offerte" horen bij
 * elkaar. Zonder onderwerp krijgt elke mail zijn eigen sleutel — dan liever te
 * veel spreiding dan alles op één hoop.
 */
export function threadKey(subject: string | null, index: number): string {
  const kaal = (subject ?? "")
    .replace(/^(\s*(re|aw|fwd|fw|antw)\s*(\[\d+\])?\s*:)+/i, "")
    .trim()
    .toLowerCase();
  return kaal === "" ? `__zonder-onderwerp-${index}` : kaal;
}

/**
 * Maximaal `n` voorbeelden, zo breed mogelijk gespreid over gesprekken.
 * Verwacht de lijst op volgorde van voorkeur (nieuwste eerst) en behoudt die
 * volgorde binnen elke thread.
 */
export function pickStyleExamples<T extends StyleExampleLike>(examples: T[], n: number): T[] {
  if (n <= 0) return [];

  const threads = new Map<string, T[]>();
  examples.forEach((e, i) => {
    const key = threadKey(e.subject, i);
    const groep = threads.get(key);
    if (groep) groep.push(e);
    else threads.set(key, [e]);
  });

  const groepen = [...threads.values()];
  const gekozen: T[] = [];
  for (let ronde = 0; gekozen.length < n; ronde++) {
    let iets = false;
    for (const groep of groepen) {
      if (ronde >= groep.length) continue;
      gekozen.push(groep[ronde]);
      iets = true;
      if (gekozen.length === n) return gekozen;
    }
    if (!iets) break; // alles op
  }
  return gekozen;
}
