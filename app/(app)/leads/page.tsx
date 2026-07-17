import { PageHeader } from "@/components/PageHeader";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { LeadFormModal } from "@/components/leads/LeadFormModal";
import { getLeads } from "@/lib/queries";

export default async function LeadsPage() {
  const leads = await getLeads();
  const open = leads.filter((l) => !["deal", "afgewezen"].includes(l.status)).length;

  return (
    <div className="p-5 sm:p-8 max-w-[1200px] mx-auto">
      <PageHeader
        title="Leads"
        subtitle={
          leads.length
            ? `${leads.length} lead${leads.length === 1 ? "" : "s"} · ${open} in behandeling`
            : "Voeg je eerste lead toe"
        }
      >
        <LeadFormModal mode="create" triggerLabel="+ Nieuwe lead" />
      </PageHeader>

      <LeadsTable leads={leads} />
    </div>
  );
}
