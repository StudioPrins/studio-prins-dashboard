import { LEAD_STATUSES, LEAD_STATUS_KEYS } from "@/lib/status";
import type { Lead } from "@/lib/db/schema";

export function LeadFields({ lead }: { lead?: Lead }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <label className="label">Bedrijfsnaam *</label>
        <input name="bedrijf" required defaultValue={lead?.bedrijf ?? ""} className="input" placeholder="Restaurant De Haven" />
      </div>
      <div>
        <label className="label">Contactpersoon</label>
        <input name="contactpersoon" defaultValue={lead?.contactpersoon ?? ""} className="input" />
      </div>
      <div>
        <label className="label">Status</label>
        <select name="status" defaultValue={lead?.status ?? "nieuw"} className="input">
          {LEAD_STATUS_KEYS.map((k) => (
            <option key={k} value={k}>
              {LEAD_STATUSES[k].label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">E-mail</label>
        <input name="email" type="email" defaultValue={lead?.email ?? ""} className="input" />
      </div>
      <div>
        <label className="label">Telefoon</label>
        <input name="telefoon" defaultValue={lead?.telefoon ?? ""} className="input" />
      </div>
      <div className="col-span-2">
        <label className="label">Demo-URL (zelf gegenereerd)</label>
        <input name="demoUrl" defaultValue={lead?.demoUrl ?? ""} className="input" placeholder="https://demo.studioprins.nl/de-haven" />
      </div>
      <div className="col-span-2">
        <label className="label">Notities</label>
        <textarea name="notities" rows={3} defaultValue={lead?.notities ?? ""} className="input" placeholder="Waar gevonden, wat opgevallen…" />
      </div>
    </div>
  );
}
