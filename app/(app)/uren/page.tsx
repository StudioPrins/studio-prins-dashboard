import { PageHeader } from "@/components/PageHeader";
import { UrenFormModal } from "@/components/uren/UrenFormModal";
import { UrenPerKlant } from "@/components/uren/UrenPerKlant";
import { VerdienstenTabel } from "@/components/uren/VerdienstenTabel";
import { getUren, getKlantenVoorUren } from "@/lib/queries";
import { getSession } from "@/lib/auth";
import { formatUren, groepeerUren, medewerkerVoorEmail } from "@/lib/uren";

export default async function UrenPage() {
  const [rows, klanten, session] = await Promise.all([
    getUren(),
    getKlantenVoorUren(),
    getSession(),
  ]);

  const groepen = groepeerUren(rows, klanten);
  const totaalMinuten = rows.reduce((s, r) => s + r.minuten, 0);

  return (
    <div className="p-5 sm:p-8 max-w-[1200px] mx-auto">
      <PageHeader
        title="Gewerkte uren"
        subtitle={
          rows.length
            ? `${formatUren(totaalMinuten)} over ${rows.length} registratie${rows.length === 1 ? "" : "s"}`
            : "Noteer hier wie waaraan gewerkt heeft"
        }
      >
        <UrenFormModal
          klanten={klanten}
          standaardMedewerker={medewerkerVoorEmail(session?.email)}
        />
      </PageHeader>

      <UrenPerKlant groepen={groepen} />
      <VerdienstenTabel rows={rows} />
    </div>
  );
}
