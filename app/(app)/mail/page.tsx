import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { SyncButton } from "@/components/mail/SyncButton";
import { MailList } from "@/components/mail/MailList";
import { getMailInbox, getMailCategoryCounts, getMailAccountViews } from "@/lib/queries";
import { MAIL_CATEGORY_STYLES } from "@/lib/status";

const CATEGORY_ORDER = [
  "belangrijk",
  "beantwoorden",
  "nieuwsbrief",
  "notificatie",
  "onbelangrijk",
];

export default async function MailPage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string; account?: string }>;
}) {
  const { categorie, account } = await searchParams;
  const accountId = account ? Number(account) : undefined;

  const [messages, counts, accounts] = await Promise.all([
    getMailInbox({ categorie, accountId }),
    getMailCategoryCounts(),
    getMailAccountViews(),
  ]);

  if (accounts.length === 0) {
    return (
      <div className="p-5 sm:p-8 max-w-[1100px] mx-auto">
        <PageHeader title="Mailassistent" subtitle="Nog geen inbox gekoppeld" />
        <div className="card p-12 text-center">
          <p className="text-lg font-medium">Koppel eerst een mailaccount</p>
          <p className="mt-1 text-sm text-muted">
            Voeg je Outlook-inboxen toe via IMAP/SMTP om te beginnen.
          </p>
          <Link href="/mail/instellingen" className="btn btn-primary mt-4 inline-block">
            Naar mailaccounts
          </Link>
        </div>
      </div>
    );
  }

  const buildHref = (cat?: string, acc?: number) => {
    const p = new URLSearchParams();
    if (cat) p.set("categorie", cat);
    if (acc != null) p.set("account", String(acc));
    const qs = p.toString();
    return qs ? `/mail?${qs}` : "/mail";
  };

  return (
    <div className="p-5 sm:p-8 max-w-[1100px] mx-auto">
      <PageHeader
        title="Mailassistent"
        subtitle={`${counts.__totaal ?? 0} nieuwe mail${(counts.__totaal ?? 0) === 1 ? "" : "s"}`}
      >
        <Link href="/mail/instellingen" className="btn btn-secondary">
          Accounts
        </Link>
        <SyncButton />
      </PageHeader>

      {/* Categorie-tabs */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <Tab href={buildHref(undefined, accountId)} active={!categorie} label="Alle" count={counts.__totaal ?? 0} />
        {CATEGORY_ORDER.map((c) => (
          <Tab
            key={c}
            href={buildHref(c, accountId)}
            active={categorie === c}
            label={MAIL_CATEGORY_STYLES[c].label}
            count={counts[c] ?? 0}
          />
        ))}
      </div>

      {/* Accountfilter */}
      {accounts.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          <Chip href={buildHref(categorie, undefined)} active={accountId == null} label="Alle accounts" />
          {accounts.map((a) => (
            <Chip
              key={a.id}
              href={buildHref(categorie, a.id)}
              active={accountId === a.id}
              label={a.naam}
            />
          ))}
        </div>
      )}

      <MailList messages={messages} />
    </div>
  );
}

function Tab({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className="rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors"
      style={
        active
          ? { background: "var(--accent-soft)", color: "var(--accent-ink)" }
          : { color: "var(--ink-soft)", background: "var(--surface-2)" }
      }
    >
      {label}
      <span className="ml-1.5 text-xs opacity-70">{count}</span>
    </Link>
  );
}

function Chip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap"
      style={
        active
          ? { background: "var(--accent)", color: "#fff" }
          : { color: "var(--ink-soft)", background: "var(--surface-2)" }
      }
    >
      {label}
    </Link>
  );
}
