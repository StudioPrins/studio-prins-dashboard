"use client";

import { useState, useTransition } from "react";
import { deleteUur } from "@/lib/actions/uren";
import { formatUren, medewerkerNaam, TEAM, type UrenGroep } from "@/lib/uren";
import { formatDate } from "@/lib/format";

export function UrenPerKlant({ groepen }: { groepen: UrenGroep[] }) {
  const [open, setOpen] = useState<string[]>([]);
  const heeftUren = groepen.some((g) => g.regels.length > 0);

  const toggle = (sleutel: string) =>
    setOpen((huidig) =>
      huidig.includes(sleutel) ? huidig.filter((s) => s !== sleutel) : [...huidig, sleutel]
    );

  if (!heeftUren && groepen.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-lg font-medium">Nog geen uren geregistreerd</p>
        <p className="mt-1 text-sm text-muted">
          Klik rechtsboven op “Uren toevoegen” om te beginnen.
        </p>
      </div>
    );
  }

  return (
    <>
      {!heeftUren && (
        <p className="mb-3 text-sm text-muted">
          Nog geen uren geregistreerd — klik rechtsboven op “Uren toevoegen” om te beginnen.
        </p>
      )}

      <div className="card overflow-hidden">
        {/* Desktop-tabel */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-line">
                <th className="font-medium px-5 py-3">Klant</th>
                {TEAM.map((m) => (
                  <th key={m.key} className="font-medium px-3 py-3 text-right">
                    {m.naam}
                  </th>
                ))}
                <th className="font-medium px-5 py-3 text-right">Totaal</th>
              </tr>
            </thead>
            <tbody>
              {groepen.map((groep) => (
                <GroepRijen
                  key={groep.sleutel}
                  groep={groep}
                  open={open.includes(groep.sleutel)}
                  onToggle={() => toggle(groep.sleutel)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobiele kaarten */}
        <div className="md:hidden divide-y divide-line">
          {groepen.map((groep) => (
            <GroepKaart
              key={groep.sleutel}
              groep={groep}
              open={open.includes(groep.sleutel)}
              onToggle={() => toggle(groep.sleutel)}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function GroepRijen({
  groep,
  open,
  onToggle,
}: {
  groep: UrenGroep;
  open: boolean;
  onToggle: () => void;
}) {
  const leeg = groep.regels.length === 0;
  const paneelId = `uren-${groep.sleutel}`;

  return (
    <>
      <tr
        className="border-b border-line last:border-0"
        style={{ background: open ? "var(--surface-2)" : undefined }}
      >
        <td className="px-5 py-3">
          <button
            type="button"
            onClick={onToggle}
            disabled={leeg}
            aria-expanded={open}
            aria-controls={paneelId}
            className="flex items-center gap-2 text-left disabled:cursor-default"
          >
            <span className="text-muted text-xs w-3" aria-hidden="true">
              {leeg ? "" : open ? "▾" : "▸"}
            </span>
            <span className={leeg ? "text-muted" : "font-medium"}>{groep.naam}</span>
            {groep.soort === "bedrijf" && (
              <span
                className="badge"
                style={{ background: "var(--accent-soft)", color: "var(--accent-ink)" }}
              >
                intern
              </span>
            )}
          </button>
        </td>
        {TEAM.map((m) => (
          <td
            key={m.key}
            className="px-3 py-3 text-right tabular-nums"
            style={{ color: groep.totalen[m.key] ? undefined : "var(--muted)" }}
          >
            {formatUren(groep.totalen[m.key] ?? 0)}
          </td>
        ))}
        <td
          className="px-5 py-3 text-right tabular-nums font-medium"
          style={{ color: leeg ? "var(--muted)" : undefined }}
        >
          {formatUren(groep.totaalMinuten)}
        </td>
      </tr>

      {open &&
        groep.regels.map((r, i) => (
          <tr
            key={r.id}
            id={i === 0 ? paneelId : undefined}
            style={{ background: "var(--surface-2)" }}
          >
            <td colSpan={TEAM.length + 2} className="px-5 py-2 border-b border-line">
              <RegelInhoud regel={r} />
            </td>
          </tr>
        ))}
    </>
  );
}

function GroepKaart({
  groep,
  open,
  onToggle,
}: {
  groep: UrenGroep;
  open: boolean;
  onToggle: () => void;
}) {
  const leeg = groep.regels.length === 0;
  const paneelId = `uren-m-${groep.sleutel}`;

  return (
    <div className="p-4">
      <button
        type="button"
        onClick={onToggle}
        disabled={leeg}
        aria-expanded={open}
        aria-controls={paneelId}
        className="flex w-full items-center justify-between gap-2 text-left disabled:cursor-default"
      >
        <span className="flex items-center gap-2">
          <span className="text-muted text-xs w-3" aria-hidden="true">
            {leeg ? "" : open ? "▾" : "▸"}
          </span>
          <span className={leeg ? "text-muted" : "font-medium"}>{groep.naam}</span>
        </span>
        <span className="tabular-nums font-medium">{formatUren(groep.totaalMinuten)}</span>
      </button>

      <div className="mt-1.5 pl-5 flex flex-wrap gap-x-3 text-xs text-muted">
        {TEAM.map((m) => (
          <span key={m.key} className="tabular-nums">
            {m.naam} {formatUren(groep.totalen[m.key] ?? 0)}
          </span>
        ))}
      </div>

      {open && (
        <div id={paneelId} className="mt-3 pl-5 flex flex-col gap-2.5">
          {groep.regels.map((r) => (
            <RegelInhoud key={r.id} regel={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function RegelInhoud({ regel }: { regel: { id: number; datum: string; medewerker: string; minuten: number; omschrijving: string | null } }) {
  const [pending, start] = useTransition();
  return (
    <div
      className="flex items-start justify-between gap-3 text-sm"
      style={{ opacity: pending ? 0.55 : 1 }}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 min-w-0">
        <span className="text-muted text-xs whitespace-nowrap w-[92px] shrink-0">
          {formatDate(regel.datum)}
        </span>
        <span className="whitespace-nowrap">{medewerkerNaam(regel.medewerker)}</span>
        <span className="tabular-nums whitespace-nowrap font-medium">
          {formatUren(regel.minuten)}
        </span>
        {regel.omschrijving && <span className="text-ink-soft">{regel.omschrijving}</span>}
      </div>
      <button
        className="text-muted hover:text-danger px-1 shrink-0"
        aria-label="Registratie verwijderen"
        disabled={pending}
        onClick={() => {
          if (confirm(`Deze registratie van ${formatUren(regel.minuten)} verwijderen?`)) {
            start(() => {
              void deleteUur(regel.id);
            });
          }
        }}
      >
        ×
      </button>
    </div>
  );
}
