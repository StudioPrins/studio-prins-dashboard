/**
 * Woord-diff tussen het Claude-concept en de tekst die daadwerkelijk verstuurd
 * is. Dat verschil is het leersignaal van de mailassistent: het laat zien wat
 * het beoordelen aan het concept veranderde.
 *
 * Puur en zonder dependencies, zodat dezelfde functies zowel op de server (het
 * selecteren van correctieparen voor de prompt) als in de client (de weergave)
 * draaien, en zodat het te testen is.
 */

export type DiffType = "gelijk" | "toegevoegd" | "verwijderd";

export interface DiffSegment {
  type: DiffType;
  text: string;
}

/**
 * Boven deze lengte wegen de kosten van een exacte LCS niet meer op tegen de
 * winst; dan tonen we het middenstuk als één vervanging. Een conceptantwoord
 * blijft daar in de praktijk ruim onder.
 */
const MAX_TOKENS = 1200;

/** Whitespace normaliseren, zodat een extra spatie of witregel geen correctie is. */
export function normalizeForCompare(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Is het concept écht aangepast, of ging het ongewijzigd de deur uit? */
export function isMeaningfulEdit(concept: string, sent: string): boolean {
  return normalizeForCompare(concept) !== normalizeForCompare(sent);
}

/** Splitst in woorden én de whitespace ertussen, zodat de tekst exact herbouwbaar blijft. */
function tokenize(s: string): string[] {
  return s.split(/(\s+)/).filter((t) => t !== "");
}

function isSpace(t: string): boolean {
  return /^\s+$/.test(t);
}

/**
 * Vergelijksleutel. Bij whitespace telt alleen of er geen, één of meerdere
 * regeleindes staan: een extra spatie is dan geen wijziging, een nieuwe alinea
 * wel.
 */
function key(t: string): string {
  if (!isSpace(t)) return t;
  const newlines = (t.match(/\n/g) ?? []).length;
  if (newlines === 0) return " ";
  return newlines === 1 ? "\n" : "\n\n";
}

/** Voegt toe aan de uitvoer en plakt aaneengesloten segmenten van hetzelfde type samen. */
function push(out: DiffSegment[], type: DiffType, text: string): void {
  if (text === "") return;
  const last = out[out.length - 1];
  if (last && last.type === type) last.text += text;
  else out.push({ type, text });
}

/** Exacte diff via LCS. Alleen op het middenstuk, na het afpellen van kop en staart. */
function lcsDiff(a: string[], b: string[]): DiffSegment[] {
  const n = a.length;
  const m = b.length;
  const w = m + 1;
  const dp = new Uint32Array((n + 1) * w);

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i * w + j] =
        key(a[i]) === key(b[j])
          ? dp[(i + 1) * w + (j + 1)] + 1
          : Math.max(dp[(i + 1) * w + j], dp[i * w + (j + 1)]);
    }
  }

  const out: DiffSegment[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (key(a[i]) === key(b[j])) {
      push(out, "gelijk", a[i]);
      i++;
      j++;
    } else if (dp[(i + 1) * w + j] >= dp[i * w + (j + 1)]) {
      // Bij gelijke stand eerst het verwijderde tonen: "oud, dan nieuw" leest natuurlijker.
      push(out, "verwijderd", a[i]);
      i++;
    } else {
      push(out, "toegevoegd", b[j]);
      j++;
    }
  }
  while (i < n) push(out, "verwijderd", a[i++]);
  while (j < m) push(out, "toegevoegd", b[j++]);
  return out;
}

/** Aantal woorden in een stuk tekst, whitespace niet meegeteld. */
function woorden(text: string): number {
  return tokenize(text).filter((t) => !isSpace(t)).length;
}

/**
 * Onder deze lengte is een ongewijzigd stukje tussen twee wijzigingen geen
 * houvast maar ruis.
 */
const MIN_ANKER_WOORDEN = 3;

/**
 * Maakt de diff leesbaar. Een exacte LCS matcht ook losse functiewoorden ("ik",
 * "de", "het") tussen zinnen die verder niets met elkaar te maken hebben; bij
 * een herschreven alinea levert dat confetti op in plaats van een leesbaar
 * verschil.
 *
 * Daarom: korte ongewijzigde stukjes tússen twee wijzigingen worden opgeslokt,
 * en binnen zo'n blok komt eerst alles wat wegging en dan alles wat erbij kwam.
 * Beide teksten blijven exact terug te bouwen — er verschuift alleen tekst van
 * "gelijk" naar "verwijderd én toegevoegd".
 */
function cleanup(segments: DiffSegment[]): DiffSegment[] {
  // Korte ankers opslokken, net zolang tot er niets meer verandert: een
  // opgeslokt anker kan twee blokken aan elkaar plakken en een nieuw kort anker
  // blootleggen.
  let huidig = segments;
  for (;;) {
    const volgende: DiffSegment[] = [];
    let veranderd = false;
    for (let i = 0; i < huidig.length; i++) {
      const s = huidig[i];
      const geflankeerd =
        i > 0 &&
        i < huidig.length - 1 &&
        huidig[i - 1].type !== "gelijk" &&
        huidig[i + 1].type !== "gelijk";
      if (s.type === "gelijk" && geflankeerd && woorden(s.text) < MIN_ANKER_WOORDEN) {
        push(volgende, "verwijderd", s.text);
        push(volgende, "toegevoegd", s.text);
        veranderd = true;
      } else {
        push(volgende, s.type, s.text);
      }
    }
    huidig = volgende;
    if (!veranderd) break;
  }

  // Per blok van wijzigingen: eerst het oude, dan het nieuwe.
  const out: DiffSegment[] = [];
  for (let i = 0; i < huidig.length; ) {
    if (huidig[i].type === "gelijk") {
      push(out, "gelijk", huidig[i].text);
      i++;
      continue;
    }
    let verwijderd = "";
    let toegevoegd = "";
    while (i < huidig.length && huidig[i].type !== "gelijk") {
      if (huidig[i].type === "verwijderd") verwijderd += huidig[i].text;
      else toegevoegd += huidig[i].text;
      i++;
    }
    push(out, "verwijderd", verwijderd);
    push(out, "toegevoegd", toegevoegd);
  }
  return out;
}

/**
 * Vergelijkt twee teksten op woordniveau. Woordniveau leest bij lopende tekst
 * veel beter dan tekenniveau: je ziet welke zin korter werd, niet welke letters.
 */
export function wordDiff(before: string, after: string): DiffSegment[] {
  const a = tokenize(before);
  const b = tokenize(after);

  // Gemeenschappelijke kop en staart afpellen. Bij een typische correctie —
  // een zin geschrapt, een groet vervangen — scheelt dat vrijwel al het werk.
  let start = 0;
  while (start < a.length && start < b.length && key(a[start]) === key(b[start])) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && key(a[endA - 1]) === key(b[endB - 1])) {
    endA--;
    endB--;
  }

  const midA = a.slice(start, endA);
  const midB = b.slice(start, endB);

  const segments: DiffSegment[] = [];
  push(segments, "gelijk", a.slice(0, start).join(""));

  if (midA.length > MAX_TOKENS || midB.length > MAX_TOKENS) {
    push(segments, "verwijderd", midA.join(""));
    push(segments, "toegevoegd", midB.join(""));
  } else if (midA.length > 0 || midB.length > 0) {
    for (const seg of lcsDiff(midA, midB)) push(segments, seg.type, seg.text);
  }

  push(segments, "gelijk", a.slice(endA).join(""));
  return cleanup(segments);
}

/**
 * Hoeveel er is aangepast: 0 = ongewijzigd verstuurd, 1 = volledig herschreven.
 * Telt woorden, geen tekens, en negeert whitespace.
 */
export function editRatio(concept: string, sent: string): number {
  let changed = 0;
  let total = 0;
  for (const seg of wordDiff(concept, sent)) {
    const words = tokenize(seg.text).filter((t) => !isSpace(t)).length;
    if (seg.type === "gelijk") {
      total += words * 2; // ongewijzigde tekst telt aan beide kanten mee
    } else {
      changed += words;
      total += words;
    }
  }
  return total === 0 ? 0 : changed / total;
}
