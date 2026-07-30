import { PageHeader } from "@/components/PageHeader";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { ChecklistTemplateEditor } from "@/components/settings/ChecklistTemplateEditor";
import { IntakeFormEditor } from "@/components/settings/IntakeFormEditor";
import { getCompanySettings, getChecklistTemplate, getIntakeFields } from "@/lib/queries";

export default async function InstellingenPage() {
  const [bedrijf, template, velden] = await Promise.all([
    getCompanySettings(),
    getChecklistTemplate(),
    getIntakeFields(),
  ]);

  return (
    <div className="p-5 sm:p-8 max-w-[820px] mx-auto">
      <PageHeader
        title="Instellingen"
        subtitle="Bedrijfsgegevens voor de facturen, de standaard onboarding-checklist en de vragen op het intakeformulier."
      />
      <div className="flex flex-col gap-8">
        <SettingsForm bedrijf={bedrijf} />
        <ChecklistTemplateEditor items={template} />
        <IntakeFormEditor fields={velden} />
      </div>
    </div>
  );
}
