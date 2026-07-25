import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { AccountFormModal } from "@/components/mail/AccountFormModal";
import { AccountsList } from "@/components/mail/AccountsList";
import { getMailAccountViews } from "@/lib/queries";

export default async function MailInstellingenPage() {
  const safe = await getMailAccountViews();

  return (
    <div className="p-5 sm:p-8 max-w-[1000px] mx-auto">
      <PageHeader
        title="Mailaccounts"
        subtitle={
          safe.length
            ? `${safe.length} account${safe.length === 1 ? "" : "s"} gekoppeld`
            : "Koppel je Outlook-inboxen via IMAP/SMTP"
        }
      >
        <Link href="/mail" className="btn btn-secondary">
          ← Terug naar mail
        </Link>
        <AccountFormModal mode="create" triggerLabel="+ Account toevoegen" />
      </PageHeader>

      <AccountsList accounts={safe} />
    </div>
  );
}
