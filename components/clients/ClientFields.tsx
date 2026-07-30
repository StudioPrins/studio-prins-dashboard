import { CLIENT_STATUSES, CLIENT_STATUS_KEYS } from "@/lib/status";
import { BILLING_FIELDS } from "@/lib/intake-fields";
import type { Client } from "@/lib/db/schema";

/** Labels/placeholders van de facturatievelden delen met het intakeformulier. */
const billing = Object.fromEntries(BILLING_FIELDS.map((f) => [f.name, f]));

export type ClientFieldsVariant = "onboarden" | "volledig";

export function ClientFields({
  client,
  variant = "volledig",
}: {
  client?: Client;
  variant?: ClientFieldsVariant;
}) {
  const abon =
    client && client.abonnementCents
      ? (client.abonnementCents / 100).toString().replace(".", ",")
      : "";

  // Onboarden: alleen wat we nodig hebben om de onboardingmail te versturen.
  // De rest van de gegevens komt via het intakeformulier binnen.
  if (variant === "onboarden") {
    return (
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="label">Bedrijfsnaam *</label>
          <input
            name="bedrijf"
            required
            defaultValue={client?.bedrijf ?? ""}
            className="input"
            placeholder="Bakkerij de Korenbloem"
          />
        </div>
        <div>
          <label className="label">Contactpersoon</label>
          <input
            name="contactpersoon"
            defaultValue={client?.contactpersoon ?? ""}
            className="input"
            placeholder="Jan Jansen"
          />
          <p className="mt-1 text-xs text-muted">
            We spreken de klant met de voornaam aan in de onboardingmail.
          </p>
        </div>
        <div>
          <label className="label">E-mailadres *</label>
          <input
            name="email"
            type="email"
            required
            defaultValue={client?.email ?? ""}
            className="input"
            placeholder="info@klant.nl"
          />
          <p className="mt-1 text-xs text-muted">
            Hier sturen we de onboardingmail met het intakeformulier naartoe.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <label className="label">Bedrijfsnaam *</label>
        <input
          name="bedrijf"
          required
          defaultValue={client?.bedrijf ?? ""}
          className="input"
          placeholder="Bakkerij de Korenbloem"
        />
      </div>
      <div>
        <label className="label">Contactpersoon</label>
        <input
          name="contactpersoon"
          defaultValue={client?.contactpersoon ?? ""}
          className="input"
          placeholder="Jan Jansen"
        />
      </div>
      <div>
        <label className="label">Status</label>
        <select
          name="status"
          defaultValue={client?.status ?? "onboarding"}
          className="input"
        >
          {CLIENT_STATUS_KEYS.map((k) => (
            <option key={k} value={k}>
              {CLIENT_STATUSES[k].label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">E-mail</label>
        <input
          name="email"
          type="email"
          defaultValue={client?.email ?? ""}
          className="input"
          placeholder="info@klant.nl"
        />
      </div>
      <div>
        <label className="label">Telefoon</label>
        <input
          name="telefoon"
          defaultValue={client?.telefoon ?? ""}
          className="input"
          placeholder="06 12 34 56 78"
        />
      </div>
      <div className="col-span-2">
        <label className="label">Website-URL</label>
        <input
          name="websiteUrl"
          defaultValue={client?.websiteUrl ?? ""}
          className="input"
          placeholder="klant.nl"
        />
        <p className="mt-1 text-xs text-muted">
          Van deze URL maken we automatisch een screenshot voor de kaart.
        </p>
      </div>
      <div className="col-span-2">
        <label className="label">Screenshot-URL (optioneel, overschrijft)</label>
        <input
          name="screenshotOverride"
          defaultValue={client?.screenshotOverride ?? ""}
          className="input"
          placeholder="https://…/eigen-afbeelding.png"
        />
      </div>
      <div>
        <label className="label">Onderhoud (€/maand)</label>
        <input
          name="abonnement"
          defaultValue={abon}
          className="input"
          inputMode="decimal"
          placeholder="19"
        />
      </div>

      <div className="col-span-2 mt-1">
        <h3 className="text-sm font-medium text-ink">Facturatiegegevens</h3>
        <p className="mt-0.5 text-xs text-muted">
          Deze gegevens komen op de facturen. Vult de klant het intakeformulier in, dan
          worden ze automatisch aangevuld.
        </p>
      </div>
      <div className="col-span-2">
        <label className="label">{billing.adres.label}</label>
        <input
          name="adres"
          defaultValue={client?.adres ?? ""}
          className="input"
          placeholder={billing.adres.placeholder}
        />
      </div>
      <div>
        <label className="label">{billing.postcode.label}</label>
        <input
          name="postcode"
          defaultValue={client?.postcode ?? ""}
          className="input"
          placeholder={billing.postcode.placeholder}
        />
      </div>
      <div>
        <label className="label">{billing.plaats.label}</label>
        <input
          name="plaats"
          defaultValue={client?.plaats ?? ""}
          className="input"
          placeholder={billing.plaats.placeholder}
        />
      </div>
      <div>
        <label className="label">{billing.kvk.label}</label>
        <input
          name="kvk"
          defaultValue={client?.kvk ?? ""}
          className="input"
          placeholder={billing.kvk.placeholder}
        />
      </div>
      <div>
        <label className="label">{billing.btw.label}</label>
        <input
          name="btw"
          defaultValue={client?.btw ?? ""}
          className="input"
          placeholder={billing.btw.placeholder}
        />
      </div>
      <div className="col-span-2">
        <label className="label">{billing.iban.label}</label>
        <input
          name="iban"
          defaultValue={client?.iban ?? ""}
          className="input"
          placeholder={billing.iban.placeholder}
        />
      </div>

      <div className="col-span-2">
        <label className="label">Notities</label>
        <textarea
          name="notities"
          defaultValue={client?.notities ?? ""}
          className="input"
          rows={3}
          placeholder="Bijzonderheden, afspraken…"
        />
      </div>
    </div>
  );
}
