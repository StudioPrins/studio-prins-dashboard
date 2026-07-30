import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LogoMark } from "@/components/Logo";
import { getClientByToken, getIntakeFields } from "@/lib/queries";
import { IntakeForm } from "./IntakeForm";

export const metadata: Metadata = {
  title: "Intakeformulier — Studio Prins",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const client = await getClientByToken(token);
  if (!client) notFound();

  const websiteFields = await getIntakeFields();

  // Bestaande waarden voorvullen zodat de klant kan aanvullen/corrigeren.
  const billingDefaults: Record<string, string> = {
    contactpersoon: client.contactpersoon ?? "",
    email: client.email ?? "",
    telefoon: client.telefoon ?? "",
    adres: client.adres ?? "",
    postcode: client.postcode ?? "",
    plaats: client.plaats ?? "",
    kvk: client.kvk ?? "",
    btw: client.btw ?? "",
    iban: client.iban ?? "",
  };
  const websiteDefaults = (client.intake ?? {}) as Record<string, string>;

  return (
    <main className="min-h-screen bg-surface-2">
      <div className="mx-auto max-w-[720px] px-4 py-10 sm:py-14">
        <div className="mb-7 flex items-center gap-3">
          <LogoMark size={40} />
          <div style={{ fontFamily: "var(--font-display)" }}>
            <p className="text-[15px] font-semibold tracking-tight text-ink">Studio Prins</p>
            <p className="text-[12px] text-muted">Webdesign & digitale ervaringen</p>
          </div>
        </div>

        <div className="card p-6 sm:p-8">
          <h1
            className="text-2xl sm:text-[28px] font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Welkom, {client.bedrijf}! 👋
          </h1>
          <p className="mt-2 text-muted leading-relaxed">
            Wat leuk dat we samen aan de slag gaan met jullie website. Vul hieronder je
            gegevens en wensen in — dan hebben we in één keer alles wat we nodig hebben om
            te starten. Alle velden zijn optioneel, maar hoe completer, hoe sneller we
            kunnen beginnen.
          </p>

          {client.driveFolderUrl && (
            <div className="mt-5 rounded-[12px] border border-line bg-surface-2 p-4">
              <p className="text-sm font-medium text-ink">Teksten en afbeeldingen aanleveren</p>
              <p className="mt-1 text-sm text-muted">
                Zet je content in je persoonlijke Google Drive-map. Je hebt geen
                Google-account nodig.
              </p>
              <a
                href={client.driveFolderUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex btn btn-secondary"
              >
                Open je Drive-map
              </a>
            </div>
          )}

          <div className="mt-7">
            <IntakeForm
              token={token}
              websiteFields={websiteFields}
              billingDefaults={billingDefaults}
              websiteDefaults={websiteDefaults}
              alreadySubmitted={Boolean(client.intakeSubmittedAt)}
            />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          © {new Date().getFullYear()} Studio Prins · Deze link is persoonlijk voor {client.bedrijf}.
        </p>
      </div>
    </main>
  );
}
