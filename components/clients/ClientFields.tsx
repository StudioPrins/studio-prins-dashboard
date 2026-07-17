import { CLIENT_STATUSES, CLIENT_STATUS_KEYS } from "@/lib/status";
import type { Client } from "@/lib/db/schema";

export function ClientFields({ client }: { client?: Client }) {
  const abon =
    client && client.abonnementCents
      ? (client.abonnementCents / 100).toString().replace(".", ",")
      : "";

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
      <div>
        <label className="label">Adres (voor facturen)</label>
        <input
          name="adres"
          defaultValue={client?.adres ?? ""}
          className="input"
          placeholder="Straat 1, 3000 AA Plaats"
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
