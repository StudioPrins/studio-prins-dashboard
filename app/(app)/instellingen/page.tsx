import { PageHeader } from "@/components/PageHeader";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { getCompanySettings } from "@/lib/queries";

export default async function InstellingenPage() {
  const bedrijf = await getCompanySettings();

  return (
    <div className="p-5 sm:p-8 max-w-[820px] mx-auto">
      <PageHeader
        title="Bedrijfsgegevens"
        subtitle="Deze gegevens verschijnen op elke factuur en offerte."
      />
      <SettingsForm bedrijf={bedrijf} />
    </div>
  );
}
