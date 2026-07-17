import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { CLIENT_STATUSES } from "@/lib/status";
import { screenshotUrl } from "@/lib/screenshot";
import { formatCents } from "@/lib/format";
import type { ClientOverview } from "@/lib/queries";

export function ClientCard({ item }: { item: ClientOverview }) {
  const { client, tasksDone, tasksTotal, openstaandCents } = item;
  const shot = screenshotUrl(client.websiteUrl, client.screenshotOverride);
  const pct = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;

  return (
    <Link
      href={`/klanten/${client.id}`}
      className="card group overflow-hidden transition-shadow hover:shadow-[var(--shadow-md)]"
    >
      <div className="relative aspect-[16/10] bg-surface-2 overflow-hidden border-b border-line">
        {shot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shot}
            alt={`Website van ${client.bedrijf}`}
            loading="lazy"
            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-sm">
            Geen website
          </div>
        )}
        <div className="absolute top-2.5 left-2.5">
          <StatusBadge map={CLIENT_STATUSES} status={client.status} />
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold tracking-tight leading-tight">
            {client.bedrijf}
          </h3>
          {openstaandCents > 0 && (
            <span
              className="badge shrink-0"
              style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
              title="Openstaand factuurbedrag"
            >
              {formatCents(openstaandCents)}
            </span>
          )}
        </div>
        {client.contactpersoon && (
          <p className="mt-0.5 text-sm text-muted">{client.contactpersoon}</p>
        )}

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted mb-1.5">
            <span>Checklist</span>
            <span className="font-medium text-ink-soft">
              {tasksTotal > 0 ? `${tasksDone}/${tasksTotal}` : "—"}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background: pct === 100 ? "var(--success)" : "var(--accent)",
              }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
