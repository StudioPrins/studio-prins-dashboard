import type { Client } from "@/lib/db/schema";
import { getIntakeFields } from "@/lib/queries";
import { formatDate } from "@/lib/format";

/**
 * Toont de door de klant aangeleverde intake-gegevens (facturatie + websitewensen).
 * Alleen zichtbaar zodra het formulier is ingevuld.
 */
export async function IntakeSummary({ client }: { client: Client }) {
  if (!client.intakeSubmittedAt) return null;

  const facturatie: [string, string | null][] = [
    ["Contactpersoon", client.contactpersoon],
    ["E-mail", client.email],
    ["Telefoon", client.telefoon],
    ["Adres", client.adres],
    ["Postcode", client.postcode],
    ["Plaats", client.plaats],
    ["KVK-nummer", client.kvk],
    ["Btw-nummer", client.btw],
    ["IBAN", client.iban],
  ];
  const intake = (client.intake ?? {}) as Record<string, string>;
  const velden = await getIntakeFields();

  // Eerst de vragen zoals ze nu in het formulier staan, daarna antwoorden op
  // vragen die inmiddels verwijderd zijn — die vallen terug op hun sleutelnaam,
  // zodat een verwijderde vraag nooit stilzwijgend data verbergt.
  const bekend = new Set(velden.map((f) => f.naam));
  const wensen: (readonly [string, string])[] = [
    ...velden.map((f) => [f.label, intake[f.naam]] as const),
    ...Object.entries(intake).filter(([k]) => !bekend.has(k)),
  ].filter((r): r is readonly [string, string] => Boolean(r[1] && r[1].trim()));

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold tracking-tight">Aangeleverd via intake</h2>
        <span className="text-xs text-muted">Ingevuld op {formatDate(client.intakeSubmittedAt)}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-medium text-muted mb-2">Bedrijfsgegevens</h3>
          <dl className="text-sm">
            {facturatie.map(([label, value]) => (
              <div
                key={label}
                className="flex items-start justify-between gap-4 border-b border-line py-2 last:border-0"
              >
                <dt className="text-muted shrink-0">{label}</dt>
                <dd className="text-right text-ink">{value || <span className="text-muted">—</span>}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted mb-2">Wensen voor de website</h3>
          {wensen.length === 0 ? (
            <p className="text-sm text-muted">Geen wensen ingevuld.</p>
          ) : (
            <dl className="text-sm flex flex-col gap-3">
              {wensen.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-muted">{label}</dt>
                  <dd className="mt-0.5 text-ink whitespace-pre-wrap">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}
