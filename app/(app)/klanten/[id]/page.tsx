import Link from "next/link";
import { notFound } from "next/navigation";
import { getClientDetail } from "@/lib/queries";
import { Checklist } from "@/components/clients/Checklist";
import { ClientFormModal } from "@/components/clients/ClientFormModal";
import { ClientStatusSelect } from "@/components/clients/ClientStatusSelect";
import { DeleteClientButton } from "@/components/clients/DeleteClientButton";
import { OnboardingPanel } from "@/components/clients/OnboardingPanel";
import { IntakeSummary } from "@/components/clients/IntakeSummary";
import { InvoiceList } from "@/components/invoices/InvoiceList";
import { screenshotUrl, toHref } from "@/lib/screenshot";
import { publicBaseUrl } from "@/lib/site";
import { formatCents } from "@/lib/format";

export default async function KlantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getClientDetail(Number(id));
  if (!detail) notFound();

  const { client, tasks, invoices } = detail;
  const shot = screenshotUrl(client.websiteUrl, client.screenshotOverride);
  const websiteHref = toHref(client.websiteUrl);
  const formUrl = client.onboardingToken
    ? `${publicBaseUrl()}/onboarding/${client.onboardingToken}`
    : null;

  return (
    <div className="p-5 sm:p-8 max-w-[1400px] mx-auto">
      <Link href="/" className="text-sm text-muted hover:text-ink inline-flex items-center gap-1 mb-5">
        ← Alle klanten
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
        <div>
          <h1
            className="text-2xl sm:text-[28px] font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {client.bedrijf}
          </h1>
          {client.contactpersoon && (
            <p className="mt-1 text-muted">{client.contactpersoon}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ClientStatusSelect clientId={client.id} status={client.status} />
          <ClientFormModal
            mode="edit"
            client={client}
            triggerLabel="Bewerken"
            triggerClass="btn btn-secondary"
          />
        </div>
      </div>

      <div className="mb-6">
        <OnboardingPanel
          clientId={client.id}
          hasEmail={Boolean(client.email)}
          email={client.email}
          sentAt={client.onboardingSentAt ? client.onboardingSentAt.toISOString() : null}
          submittedAt={client.intakeSubmittedAt ? client.intakeSubmittedAt.toISOString() : null}
          formUrl={formUrl}
          driveUrl={client.driveFolderUrl}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* Linkerkolom: website + gegevens */}
        <div className="flex flex-col gap-6">
          <div className="card overflow-hidden">
            <div className="aspect-[16/10] bg-surface-2 border-b border-line">
              {shot ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shot} alt={`Website van ${client.bedrijf}`} className="w-full h-full object-cover object-top" />
              ) : (
                <div className="w-full h-full grid place-items-center text-muted text-sm">
                  Geen website
                </div>
              )}
            </div>
            <dl className="p-5 grid grid-cols-1 gap-3 text-sm">
              <Row label="Website">
                {websiteHref ? (
                  <a href={websiteHref} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                    {client.websiteUrl}
                  </a>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </Row>
              <Row label="E-mail">
                {client.email ? (
                  <a href={`mailto:${client.email}`} className="text-accent hover:underline">
                    {client.email}
                  </a>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </Row>
              <Row label="Telefoon">{client.telefoon || <span className="text-muted">—</span>}</Row>
              <Row label="Adres">{client.adres || <span className="text-muted">—</span>}</Row>
              <Row label="Onderhoud">
                {client.abonnementCents > 0 ? (
                  <span className="font-medium">{formatCents(client.abonnementCents)}/mnd</span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </Row>
            </dl>
          </div>

          {client.notities && (
            <div className="card p-5">
              <h2 className="font-semibold tracking-tight mb-2">Notities</h2>
              <p className="text-sm text-ink-soft whitespace-pre-wrap">{client.notities}</p>
            </div>
          )}
        </div>

        {/* Rechterkolom: checklist */}
        <div>
          <Checklist clientId={client.id} tasks={tasks} />
        </div>
      </div>

      {/* Intake-gegevens (zichtbaar zodra ingevuld) */}
      {client.intakeSubmittedAt && (
        <div className="mt-6">
          <IntakeSummary client={client} />
        </div>
      )}

      {/* Facturen */}
      <div className="card p-5 mt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold tracking-tight">Facturen & offertes</h2>
          <Link href={`/facturen/nieuw?klant=${client.id}`} className="btn btn-secondary">
            + Opmaken
          </Link>
        </div>
        <InvoiceList invoices={invoices} />
      </div>

      <div className="mt-8">
        <DeleteClientButton clientId={client.id} bedrijf={client.bedrijf} />
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line pb-3 last:border-0 last:pb-0">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
