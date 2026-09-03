import { DEMO } from "@/lib/demo";

const REPO = "https://github.com/StudioPrins/studio-prins-dashboard";

/**
 * Strook boven het dashboard in de demo-omgeving. Maakt in één oogopslag
 * duidelijk dat alles wat je ziet verzonnen is — en dat rondklikken mag,
 * want de data wordt elke nacht teruggezet.
 */
export function DemoBanner() {
  if (!DEMO) return null;

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-xs"
      style={{ background: "var(--accent-soft)", color: "var(--accent-ink)" }}
    >
      <span>
        <strong className="font-semibold">Demo-omgeving.</strong> Alle klanten,
        uren, facturen en mails hieronder zijn verzonnen.
      </span>
      <span className="opacity-70">
        Aanpassen mag — elke nacht om 04:00 wordt alles teruggezet.
      </span>
      <a
        href={REPO}
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2 hover:no-underline"
      >
        Broncode op GitHub
      </a>
    </div>
  );
}
