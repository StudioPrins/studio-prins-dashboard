"use client";

import { useActionState, useMemo, useState } from "react";
import { createInvoice, type FormState } from "@/lib/actions/invoices";
import { euroToCents, formatCents, centsToInput, toISODate, addMonths } from "@/lib/format";
import { lineTotalCents } from "@/lib/invoice-calc";
import { formatUren, uurNaarFactuurregel } from "@/lib/uren";
import { BEDRIJF } from "@/lib/bedrijf";
import type { Client, UurRegistratie } from "@/lib/db/schema";

/** `uurId` is de herkomst: gevuld = uit de urenregistratie, null = handmatig. */
type Line = {
  key: number;
  uurId: number | null;
  omschrijving: string;
  aantal: string;
  prijs: string;
};

let counter = 0;
const newLine = (): Line => ({
  key: counter++,
  uurId: null,
  omschrijving: "",
  aantal: "1",
  prijs: "",
});

/** Een geregistreerd uur als bewerkbare regel in het formulier. */
function lineFromUur(uur: UurRegistratie): Line {
  const r = uurNaarFactuurregel(uur);
  return {
    key: counter++,
    uurId: r.uurId,
    omschrijving: r.omschrijving,
    aantal: r.aantal,
    prijs: centsToInput(r.prijsCents),
  };
}

/** Regels die de gebruiker zelf getypt heeft — die blijven bij een klantwissel staan. */
const gevuldHandmatig = (l: Line) =>
  l.uurId == null && (l.omschrijving.trim() !== "" || l.prijs.trim() !== "");

/** Een formulier zonder regels is onwerkbaar — dan altijd één lege regel. */
function metFallback(regels: Line[]): Line[] {
  return regels.length > 0 ? regels : [newLine()];
}

export function InvoiceBuilder({
  clients,
  factureerbareUren,
  defaultClientId,
}: {
  clients: Client[];
  factureerbareUren: UurRegistratie[];
  defaultClientId?: number;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    createInvoice,
    {}
  );

  /** De nog niet gefactureerde uren van één klant, als factuurregels. */
  function urenRegelsVoor(id: string): Line[] {
    const cid = Number(id);
    if (!Number.isInteger(cid) || cid <= 0) return [];
    return factureerbareUren.filter((u) => u.clientId === cid).map(lineFromUur);
  }

  const [type, setType] = useState<"factuur" | "offerte">("factuur");
  const [clientId, setClientId] = useState<string>(
    defaultClientId ? String(defaultClientId) : ""
  );
  const initialClient = clients.find((c) => c.id === defaultClientId);
  const [ontvanger, setOntvanger] = useState({
    bedrijf: initialClient?.bedrijf ?? "",
    contact: initialClient?.contactpersoon ?? "",
    email: initialClient?.email ?? "",
    adres: initialClient?.adres ?? "",
  });
  const [btw, setBtw] = useState(String(BEDRIJF.standaardBtw));
  const [datum, setDatum] = useState(toISODate());
  const [lines, setLines] = useState<Line[]>(() =>
    metFallback(urenRegelsVoor(defaultClientId ? String(defaultClientId) : ""))
  );

  function pickClient(id: string) {
    setClientId(id);
    const c = clients.find((x) => String(x.id) === id);
    if (c) {
      setOntvanger({
        bedrijf: c.bedrijf,
        contact: c.contactpersoon ?? "",
        email: c.email ?? "",
        adres: c.adres ?? "",
      });
    }
    // Uren van de vorige klant eruit, die van de nieuwe erin; eigen typwerk blijft.
    setLines((prev) =>
      metFallback([
        ...(type === "factuur" ? urenRegelsVoor(id) : []),
        ...prev.filter(gevuldHandmatig),
      ])
    );
  }

  /**
   * Een offerte is werk vooraf, geen afrekening van gewerkte uren: daar horen
   * geen uur-regels op (ze worden ook niet afgeboekt). Terug naar factuur haalt
   * ze weer op.
   */
  function pickType(t: "factuur" | "offerte") {
    setType(t);
    setLines((prev) =>
      metFallback([
        ...(t === "factuur" ? urenRegelsVoor(clientId) : []),
        ...prev.filter(gevuldHandmatig),
      ])
    );
  }

  const totals = useMemo(() => {
    const sub = lines.reduce(
      (s, l) => s + lineTotalCents(l.aantal || "0", euroToCents(l.prijs || "0")),
      0
    );
    const b = Math.round((sub * (parseInt(btw, 10) || 0)) / 100);
    return { sub, btw: b, total: sub + b };
  }, [lines, btw]);

  /** Samenvatting van wat er uit de urenregistratie is opgehaald. */
  const urenInfo = useMemo(() => {
    const uurLines = lines.filter((l) => l.uurId != null);
    if (uurLines.length === 0) return null;
    const uren = uurLines.reduce(
      (s, l) => s + (parseFloat(l.aantal.replace(",", ".")) || 0),
      0
    );
    const cents = uurLines.reduce(
      (s, l) => s + lineTotalCents(l.aantal || "0", euroToCents(l.prijs || "0")),
      0
    );
    return { aantal: uurLines.length, uren, cents };
  }, [lines]);

  const vervaldatum =
    type === "factuur" ? addMonths(BEDRIJF.betaaltermijnMaanden, new Date(datum)) : "";

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[1.4fr_1fr] items-start">
      {/* hidden velden die de server verwacht */}
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="clientId" value={clientId} />
      <input type="hidden" name="vervaldatum" value={vervaldatum} />

      <div className="flex flex-col gap-6">
        {/* Type + klant */}
        <div className="card p-5">
          <div className="flex gap-2 mb-5">
            {(["factuur", "offerte"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => pickType(t)}
                className="btn"
                style={
                  type === t
                    ? { background: "var(--accent)", color: "#fff" }
                    : { background: "var(--surface-2)", color: "var(--ink-soft)" }
                }
              >
                {t === "factuur" ? "Factuur" : "Offerte"}
              </button>
            ))}
          </div>

          <label className="label">Klant koppelen (optioneel)</label>
          <select
            className="input mb-4"
            value={clientId}
            onChange={(e) => pickClient(e.target.value)}
          >
            <option value="">— Geen / handmatig —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.bedrijf}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Ontvanger (bedrijf) *</label>
              <input
                name="ontvangerBedrijf"
                required
                className="input"
                value={ontvanger.bedrijf}
                onChange={(e) => setOntvanger({ ...ontvanger, bedrijf: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Contactpersoon</label>
              <input
                name="ontvangerContact"
                className="input"
                value={ontvanger.contact}
                onChange={(e) => setOntvanger({ ...ontvanger, contact: e.target.value })}
              />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input
                name="ontvangerEmail"
                className="input"
                value={ontvanger.email}
                onChange={(e) => setOntvanger({ ...ontvanger, email: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="label">Adres</label>
              <input
                name="ontvangerAdres"
                className="input"
                value={ontvanger.adres}
                onChange={(e) => setOntvanger({ ...ontvanger, adres: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Regels */}
        <div className="card p-5">
          <h2 className="font-semibold tracking-tight mb-4">Regels</h2>

          {urenInfo && (
            <p
              className="mb-4 text-sm rounded-[10px] px-3 py-2"
              style={{ background: "var(--surface-2)", color: "var(--ink-soft)" }}
            >
              {urenInfo.aantal} registratie{urenInfo.aantal === 1 ? "" : "s"} uit de
              urenregistratie · {formatUren(urenInfo.uren * 60)} ·{" "}
              {formatCents(urenInfo.cents)} — pas gerust aan of gooi regels weg.
            </p>
          )}

          <div className="flex flex-col gap-2">
            <div className="hidden sm:grid grid-cols-[1fr_70px_110px_100px_32px] gap-2 text-xs text-muted px-1">
              <span>Omschrijving</span>
              <span>Aantal</span>
              <span>Prijs (€)</span>
              <span className="text-right">Totaal</span>
              <span />
            </div>
            {lines.map((line, i) => (
              <div
                key={line.key}
                className="grid grid-cols-2 sm:grid-cols-[1fr_70px_110px_100px_32px] gap-2 items-center"
              >
                {/* Houdt de herkomst bij; leeg bij handmatige regels zodat de
                    parallelle arrays op de server uitgelijnd blijven. */}
                <input type="hidden" name="uurId" value={line.uurId ?? ""} />
                <input
                  name="omschrijving"
                  className="input col-span-2 sm:col-span-1"
                  placeholder="Bijv. Website ontwerp & bouw"
                  value={line.omschrijving}
                  onChange={(e) => updateLine(i, "omschrijving", e.target.value)}
                />
                <input
                  name="aantal"
                  className="input"
                  inputMode="decimal"
                  value={line.aantal}
                  onChange={(e) => updateLine(i, "aantal", e.target.value)}
                />
                <input
                  name="prijs"
                  className="input"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={line.prijs}
                  onChange={(e) => updateLine(i, "prijs", e.target.value)}
                />
                <span className="text-sm text-right tabular-nums hidden sm:block">
                  {formatCents(lineTotalCents(line.aantal || "0", euroToCents(line.prijs || "0")))}
                </span>
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  className="text-muted hover:text-danger justify-self-end"
                  aria-label="Regel verwijderen"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-ghost mt-3"
            onClick={() => setLines([...lines, newLine()])}
          >
            + Regel toevoegen
          </button>
        </div>

        <div className="card p-5">
          <label className="label">Notitie / opmerking (optioneel)</label>
          <textarea name="notitie" rows={2} className="input" placeholder="Bijv. betaling binnen 14 dagen." />
        </div>
      </div>

      {/* Zijkolom: instellingen + totalen */}
      <div className="flex flex-col gap-6 lg:sticky lg:top-8">
        <div className="card p-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Datum</label>
              <input
                type="date"
                name="datum"
                className="input"
                value={datum}
                onChange={(e) => setDatum(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Btw %</label>
              <input
                name="btwPercentage"
                className="input"
                inputMode="numeric"
                value={btw}
                onChange={(e) => setBtw(e.target.value)}
              />
            </div>
          </div>
          {type === "factuur" && (
            <p className="mt-3 text-xs text-muted">Vervaldatum: {vervaldatum}</p>
          )}
        </div>

        <div className="card p-5">
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotaal</dt>
              <dd className="tabular-nums">{formatCents(totals.sub)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Btw ({parseInt(btw, 10) || 0}%)</dt>
              <dd className="tabular-nums">{formatCents(totals.btw)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 mt-1 text-base font-semibold">
              <dt>Totaal</dt>
              <dd className="tabular-nums">{formatCents(totals.total)}</dd>
            </div>
          </dl>

          {state.error && (
            <p
              className="mt-4 text-sm rounded-[10px] px-3 py-2"
              style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
            >
              {state.error}
            </p>
          )}

          <button type="submit" className="btn btn-primary w-full mt-5" disabled={pending}>
            {pending ? "Opslaan…" : `${type === "offerte" ? "Offerte" : "Factuur"} opslaan`}
          </button>
        </div>
      </div>
    </form>
  );

  function updateLine(i: number, field: "omschrijving" | "aantal" | "prijs", value: string) {
    setLines((prev) =>
      prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l))
    );
  }
  function removeLine(i: number) {
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)));
  }
}
