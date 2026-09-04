"use client";

import { useMemo, useState } from "react";
import { editRatio, wordDiff } from "@/lib/mail/diff";

type Weergave = "verschil" | "concept" | "verstuurd";

/**
 * Laat zien wat er met het concept gebeurde voordat het de deur uitging:
 * doorgestreept wat eruit ging, gemarkeerd wat erbij kwam. Dit is het signaal
 * waar de assistent van leert, dus het hoort ook zichtbaar te zijn.
 */
export function DiffView({
  concept,
  verstuurd,
}: {
  concept: string;
  verstuurd: string;
}) {
  const [weergave, setWeergave] = useState<Weergave>("verschil");
  const segments = useMemo(() => wordDiff(concept, verstuurd), [concept, verstuurd]);
  const ratio = useMemo(() => editRatio(concept, verstuurd), [concept, verstuurd]);

  const ongewijzigd = segments.every((s) => s.type === "gelijk");

  return (
    <div className="mt-4 border-t border-line pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold">
          {ongewijzigd ? "Concept ongewijzigd verstuurd" : "Wat je aanpaste"}
        </h3>
        <div className="flex items-center gap-2">
          {!ongewijzigd && (
            <span className="text-xs text-muted">{Math.round(ratio * 100)}% aangepast</span>
          )}
          <div className="flex rounded-full bg-surface-2 p-0.5">
            {(["verschil", "concept", "verstuurd"] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWeergave(w)}
                className="rounded-full px-2.5 py-1 text-xs font-medium capitalize transition-colors"
                style={
                  weergave === w
                    ? { background: "var(--surface)", color: "var(--ink)" }
                    : { color: "var(--ink-soft)" }
                }
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[10px] border border-line bg-surface-2 p-3 max-h-[40vh] overflow-y-auto">
        <p className="whitespace-pre-wrap break-words text-sm">
          {weergave === "concept" && concept}
          {weergave === "verstuurd" && verstuurd}
          {weergave === "verschil" &&
            segments.map((s, i) => {
              if (s.type === "gelijk") return <span key={i}>{s.text}</span>;
              const verwijderd = s.type === "verwijderd";
              return (
                <span
                  key={i}
                  className="rounded-[3px]"
                  style={{
                    background: verwijderd ? "var(--danger-soft)" : "var(--success-soft)",
                    color: verwijderd ? "var(--danger)" : "var(--success)",
                    textDecoration: verwijderd ? "line-through" : undefined,
                  }}
                >
                  {s.text}
                </span>
              );
            })}
        </p>
      </div>

      {weergave === "verschil" && !ongewijzigd && (
        <p className="mt-2 text-xs text-muted">
          <span style={{ color: "var(--danger)" }}>Doorgestreept</span> stond in het concept,{" "}
          <span style={{ color: "var(--success)" }}>gemarkeerd</span> heb je zelf geschreven. Deze
          correctie gaat mee in de prompt van je volgende concept.
        </p>
      )}
    </div>
  );
}
