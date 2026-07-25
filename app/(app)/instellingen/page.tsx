import { PageHeader } from "@/components/PageHeader";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { ChecklistTemplateEditor } from "@/components/settings/ChecklistTemplateEditor";
import { getCompanySettings, getChecklistTemplate } from "@/lib/queries";

export default async function InstellingenPage() {
  const [bedrijf, template] = await Promise.all([
    getCompanySettings(),
    getChecklistTemplate(),
  ]);

  return (
    <div className="p-5 sm:p-8 max-w-[820px] mx-auto">
      <PageHeader
        title="Instellingen"
        subtitle="Bedrijfsgegevens voor de facturen en de standaard onboarding-checklist."
      />
      <div className="flex flex-col gap-8">
        <SettingsForm bedrijf={bedrijf} />
        <ChecklistTemplateEditor items={template} />
      </div>
    </div>
  );
}
