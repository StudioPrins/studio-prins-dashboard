import { PageHeader } from "@/components/PageHeader";
import { ClientCard } from "@/components/clients/ClientCard";
import { ClientFormModal } from "@/components/clients/ClientFormModal";
import { getClientsOverview } from "@/lib/queries";

export default async function KlantenPage() {
  const items = await getClientsOverview();

  const actief = items.filter((i) => i.client.status !== "gearchiveerd").length;

  return (
    <div className="p-5 sm:p-8 max-w-[1400px] mx-auto">
      <PageHeader
        title="Klanten"
        subtitle={
          items.length
            ? `${items.length} klant${items.length === 1 ? "" : "en"} · ${actief} actief`
            : "Nog geen klanten"
        }
      >
        <ClientFormModal mode="create" triggerLabel="+ Nieuwe klant" />
      </PageHeader>

      {items.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-lg font-medium">Nog geen klanten</p>
          <p className="mt-1 text-sm text-muted">
            Voeg je eerste klant toe, of zet een lead om naar een klant.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <ClientCard key={item.client.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
